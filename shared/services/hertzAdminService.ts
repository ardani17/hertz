import { execute, query, withTransaction, type DbClient } from '../db';
import { HertzCommentService } from './hertzCommentService';
import { HertzCommunityNoteService } from './hertzCommunityNoteService';
import { HertzForbiddenError, HertzNotFoundError } from './hertzPostService';
import { ActivityLogService } from './activityLog';
import { HertzPostRepository } from '../repositories/hertzPostRepository';
import type { MemberSessionUser } from '../types/membership';

export class HertzAdminService {
  private readonly posts = new HertzPostRepository();
  private readonly comments = new HertzCommentService();
  private readonly notes = new HertzCommunityNoteService();
  private readonly logs = new ActivityLogService();

  assertAdmin(user: MemberSessionUser | null): asserts user is MemberSessionUser {
    if (!user || user.role !== 'admin') throw new HertzForbiddenError('Akses admin diperlukan');
  }

  async listPending(user: MemberSessionUser | null) {
    this.assertAdmin(user);
    const [result, counts, reports, dmReports] = await Promise.all([
      query<{
        id: string;
        article_id: string | null;
        category: string;
        source: string;
        status: string;
        telegram_message_id: number | null;
        created_at: Date;
        content: string | null;
        title: string | null;
        author_name: string | null;
      }>(
        `SELECT hp.id, hp.article_id, hp.category, hp.source, hp.status,
                hp.telegram_message_id, hp.created_at, hp.content,
                a.title, COALESCE(u.display_name, u.username) AS author_name
         FROM hertz_posts hp
         LEFT JOIN articles a ON a.id = hp.article_id
         LEFT JOIN users u ON u.id = hp.author_id
         WHERE hp.status = 'pending_review' AND hp.deleted_at IS NULL
         ORDER BY hp.created_at DESC
         LIMIT 100`,
      ),
      query<{
        pending_posts: string;
        pending_notes: string;
        reported_posts: string;
        reported_dm_messages: string;
      }>(
        `SELECT
           (SELECT COUNT(*) FROM hertz_posts WHERE status = 'pending_review' AND deleted_at IS NULL)::text AS pending_posts,
           (SELECT COUNT(*) FROM hertz_community_notes WHERE status = 'published' AND deleted_at IS NULL)::text AS pending_notes,
           (SELECT COUNT(*) FROM hertz_reports WHERE status = 'open')::text AS reported_posts,
           (SELECT COUNT(*) FROM hertz_message_reports WHERE status = 'open')::text AS reported_dm_messages`,
      ),
      query<{
        id: string;
        target_type: string;
        target_id: string;
        reason: string;
        details: string | null;
        status: string;
        reporter_name: string | null;
        created_at: Date;
      }>(
        `SELECT r.id, r.target_type, r.target_id, r.reason, r.details, r.status,
                COALESCE(u.display_name, u.username) AS reporter_name, r.created_at
         FROM hertz_reports r
         LEFT JOIN users u ON u.id = r.reporter_user_id
         WHERE r.status = 'open'
         ORDER BY r.created_at DESC
         LIMIT 50`,
      ),
      query<{
        id: string;
        target_type: string;
        target_id: string;
        reason: string;
        details: string | null;
        status: string;
        reporter_name: string | null;
        message_preview: string | null;
        created_at: Date;
      }>(
        `SELECT r.id, 'dm_message'::text AS target_type, r.message_id::text AS target_id,
                r.reason, r.details, r.status,
                COALESCE(u.display_name, u.username) AS reporter_name,
                LEFT(COALESCE(m.body, ''), 160) AS message_preview,
                r.created_at
         FROM hertz_message_reports r
         LEFT JOIN users u ON u.id = r.reporter_user_id
         LEFT JOIN hertz_messages m ON m.id = r.message_id
         WHERE r.status = 'open'
         ORDER BY r.created_at DESC
         LIMIT 50`,
      ),
    ]);
    const countRow = counts.rows[0];
    return {
      posts: result.rows.map((row) => ({
        ...row,
        body: (row.content ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
        created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
      })),
      counts: {
        pendingPosts: Number(countRow?.pending_posts ?? 0),
        pendingNotes: Number(countRow?.pending_notes ?? 0),
        reportedPosts: Number(countRow?.reported_posts ?? 0) + Number(countRow?.reported_dm_messages ?? 0),
      },
      reports: [...reports.rows, ...dmReports.rows]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 50)
        .map((row) => ({
          ...row,
          created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
        })),
    };
  }

  async publish(postId: string, user: MemberSessionUser | null): Promise<void> {
    this.assertAdmin(user);
    await this.moderatePost(postId, user, 'published', 'hertz.post.published', true);
  }

  async reject(postId: string, user: MemberSessionUser | null): Promise<void> {
    this.assertAdmin(user);
    await this.moderatePost(postId, user, 'rejected', 'hertz.post.rejected');
  }

  async hidePost(postId: string, user: MemberSessionUser | null): Promise<void> {
    this.assertAdmin(user);
    await this.moderatePost(postId, user, 'hidden', 'hertz.post.hidden');
  }

  async restorePost(postId: string, user: MemberSessionUser | null): Promise<void> {
    this.assertAdmin(user);
    await this.moderatePost(postId, user, 'published', 'hertz.post.restored');
  }

  async hideComment(commentId: string, user: MemberSessionUser | null): Promise<void> {
    this.assertAdmin(user);
    await this.comments.hide(commentId, user);
  }

  async hideCommunityNote(noteId: string, user: MemberSessionUser | null): Promise<void> {
    this.assertAdmin(user);
    await this.notes.hide(noteId, user);
  }

  private async moderatePost(
    postId: string,
    user: MemberSessionUser,
    status: 'rejected' | 'hidden' | 'published',
    action: string,
    awardTelegramCredit = false,
  ): Promise<void> {
    await withTransaction(async (client) => {
      const resolvedPostId = await this.posts.resolvePostId(postId, client);
      if (!resolvedPostId) throw new HertzNotFoundError('Post tidak ditemukan');
      const post = await this.posts.findById(resolvedPostId, user.id, client);
      if (!post) throw new HertzNotFoundError('Post tidak ditemukan');
      await this.posts.updateStatus(resolvedPostId, status, client);
      if (status === 'published' && post.source === 'telegram' && awardTelegramCredit) {
        await awardTelegramPublishCredit(post.author_id, resolvedPostId, client);
      }
      await this.logs.log({
        actor_id: user.id,
        actor_type: 'admin',
        action,
        target_type: 'post',
        target_id: resolvedPostId,
        details: { previous_status: post.status, status, source: post.source },
      }, client);
    });
  }
}

async function awardTelegramPublishCredit(userId: string, postId: string, client: DbClient): Promise<void> {
  const result = await query<{ amount: number }>(
    `INSERT INTO hertz_credit_ledger (user_id, event_type, entity_id, amount)
     SELECT $1::uuid, 'telegram_post_published', $2::uuid, amount
     FROM hertz_credit_settings
     WHERE key = 'telegram_post_published' AND is_active = true AND amount > 0
     ON CONFLICT (user_id, event_type, entity_id) DO NOTHING
     RETURNING amount`,
    [userId, postId],
    client,
  );
  const amount = Number(result.rows[0]?.amount ?? 0);
  if (amount > 0) await execute('UPDATE users SET credit_balance = credit_balance + $1 WHERE id = $2', [amount, userId], client);
}
