import { withTransaction } from '../db';
import { PostReportRepository, type PostReportReason } from '../repositories/postReportRepository';
import { ActivityLogService } from './activityLog';
import { FeedForbiddenError, FeedNotFoundError, FeedValidationError } from './feedService';
import { FeedRepository } from '../repositories/feedRepository';
import type { MemberSessionUser } from '../types/membership';

const REASONS: PostReportReason[] = ['spam', 'misleading', 'abusive', 'off_topic', 'other'];

function cleanReason(value: unknown): PostReportReason {
  if (typeof value === 'string' && REASONS.includes(value as PostReportReason)) {
    return value as PostReportReason;
  }
  throw new FeedValidationError('Alasan report tidak valid');
}

function cleanDetails(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!text) return null;
  if (text.length > 1000) throw new FeedValidationError('Detail report maksimal 1000 karakter');
  return text;
}

export class PostReportService {
  private readonly feedRepo = new FeedRepository();
  private readonly reports = new PostReportRepository();
  private readonly logs = new ActivityLogService();

  async create(postId: string, user: MemberSessionUser | null, input: { reason?: unknown; details?: unknown }) {
    if (!user) throw new FeedForbiddenError('Login member diperlukan');
    const post = await this.feedRepo.findRawById(postId);
    if (!post || post.status !== 'published' || post.deleted_at) throw new FeedNotFoundError();
    const reason = cleanReason(input.reason ?? 'other');
    const details = cleanDetails(input.details);

    return withTransaction(async (client) => {
      const report = await this.reports.create({
        postId,
        reporterUserId: user.id,
        reason,
        details,
      }, client);
      await this.logs.log({
        actor_id: user.id,
        actor_type: user.role === 'admin' ? 'admin' : 'member',
        action: 'signal_ledger.post.reported',
        target_type: 'post',
        target_id: postId,
        details: { report_id: report.id, reason },
      }, client);
      return report;
    });
  }
}
