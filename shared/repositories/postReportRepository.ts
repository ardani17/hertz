import { execute, queryOne, type DbClient } from '../db';

export type PostReportReason = 'spam' | 'misleading' | 'abusive' | 'off_topic' | 'other';

export interface PostReportRow {
  id: string;
  post_id: string;
  reporter_user_id: string;
  reason: PostReportReason;
  details: string | null;
  status: 'open' | 'reviewing' | 'resolved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: Date | null;
  created_at: Date;
}

export class PostReportRepository {
  async create(params: {
    postId: string;
    reporterUserId: string;
    reason: PostReportReason;
    details?: string | null;
  }, client?: DbClient): Promise<PostReportRow> {
    const row = await queryOne<PostReportRow>(
      `INSERT INTO post_reports (post_id, reporter_user_id, reason, details)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (post_id, reporter_user_id)
         WHERE status IN ('open', 'reviewing')
       DO UPDATE SET
         reason = EXCLUDED.reason,
         details = EXCLUDED.details,
         created_at = NOW()
       RETURNING *`,
      [params.postId, params.reporterUserId, params.reason, params.details ?? null],
      client,
    );
    if (!row) throw new Error('Failed to create post report');
    return row;
  }

  async markReviewed(reportId: string, reviewerId: string, status: 'resolved' | 'rejected', client?: DbClient): Promise<void> {
    await execute(
      `UPDATE post_reports
       SET status = $3, reviewed_by = $2, reviewed_at = NOW()
       WHERE id = $1`,
      [reportId, reviewerId, status],
      client,
    );
  }
}
