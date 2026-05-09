import { execute, query, withTransaction } from '../db';
import { FeedForbiddenError, FeedService } from './feedService';
import { PostCommentService } from './postCommentService';
import { CommunityNoteService } from './communityNoteService';
import { ActivityLogService } from './activityLog';
import { FeedRepository } from '../repositories/feedRepository';
import type { MemberSessionUser } from '../types/membership';

export class HertzAdminService {
  private readonly feed = new FeedService();
  private readonly feedRepo = new FeedRepository();
  private readonly comments = new PostCommentService();
  private readonly notes = new CommunityNoteService();
  private readonly logs = new ActivityLogService();

  assertAdmin(user: MemberSessionUser | null): asserts user is MemberSessionUser {
    if (!user || user.role !== 'admin') {
      throw new FeedForbiddenError('Akses admin diperlukan');
    }
  }

  async listPending(user: MemberSessionUser | null): Promise<{
    posts: Array<{
      id: string;
      article_id: string | null;
      category: string;
      source: string;
      created_at: string;
      body: string;
      title: string | null;
      author_name: string | null;
      telegram_message_id: number | null;
      status: string;
    }>;
    counts: {
      pendingPosts: number;
      pendingNotes: number;
      reportedPosts: number;
    };
  }> {
    this.assertAdmin(user);
    const [result, counts] = await Promise.all([
      query<{
      id: string;
      article_id: string | null;
      category: string;
      source: string;
      status: string;
      telegram_message_id: number | null;
      created_at: Date;
      content_html: string | null;
      title: string | null;
      author_name: string | null;
    }>(
      `SELECT fp.id, fp.article_id, fp.category, fp.source, fp.status,
              fp.telegram_message_id, fp.created_at,
              a.title, a.content_html, COALESCE(u.display_name, u.username) AS author_name
       FROM feed_posts fp
       LEFT JOIN articles a ON a.id = fp.article_id
       LEFT JOIN users u ON u.id = fp.author_id
       WHERE fp.status IN ('draft', 'pending_review')
       ORDER BY fp.created_at DESC
       LIMIT 100`,
      ),
      query<{
        pending_posts: string;
        pending_notes: string;
        reported_posts: string;
      }>(
        `SELECT
           (SELECT COUNT(*) FROM feed_posts WHERE status IN ('draft', 'pending_review'))::text AS pending_posts,
           (SELECT COUNT(*) FROM community_notes WHERE status = 'published')::text AS pending_notes,
           (SELECT COUNT(*) FROM post_reports WHERE status = 'open')::text AS reported_posts`,
      ),
    ]);
    const countRow = counts.rows[0];
    return {
      posts: result.rows.map((row) => ({
        ...row,
        title: row.title,
        body: (row.content_html ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
        created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
      })),
      counts: {
        pendingPosts: Number(countRow?.pending_posts ?? 0),
        pendingNotes: Number(countRow?.pending_notes ?? 0),
        reportedPosts: Number(countRow?.reported_posts ?? 0),
      },
    };
  }

  async publish(postId: string, user: MemberSessionUser | null): Promise<void> {
    this.assertAdmin(user);
    await this.feed.publishTelegramDraft(postId, user);
  }

  async reject(postId: string, user: MemberSessionUser | null): Promise<void> {
    this.assertAdmin(user);
    await this.moderatePost(postId, user, 'rejected', 'hertz.post.rejected', 'hidden');
  }

  async hidePost(postId: string, user: MemberSessionUser | null): Promise<void> {
    this.assertAdmin(user);
    await this.moderatePost(postId, user, 'hidden', 'hertz.post.hidden', 'hidden');
  }

  async restorePost(postId: string, user: MemberSessionUser | null): Promise<void> {
    this.assertAdmin(user);
    await this.moderatePost(postId, user, 'published', 'hertz.post.restored', 'published');
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
    postStatus: 'rejected' | 'hidden' | 'published',
    action: string,
    articleStatus: 'hidden' | 'published',
  ): Promise<void> {
    await withTransaction(async (client) => {
      const post = await this.feedRepo.findRawById(postId, client);
      if (!post) {
        throw new FeedForbiddenError('Post tidak ditemukan');
      }
      await this.feedRepo.updatePostStatus(postId, postStatus, client);
      if (post.article_id) {
        await execute('UPDATE articles SET status = $1 WHERE id = $2', [articleStatus, post.article_id], client);
      }
      await this.logs.log({
        actor_id: user.id,
        actor_type: 'admin',
        action,
        target_type: 'post',
        target_id: postId,
        details: { article_id: post.article_id, status: postStatus },
      }, client);
    });
  }
}

export { HertzAdminService as SignalLedgerAdminService };
