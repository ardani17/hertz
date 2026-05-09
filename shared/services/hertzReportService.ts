import { queryOne, withTransaction } from '../db';
import { HertzPostRepository } from '../repositories/hertzPostRepository';
import { ActivityLogService } from './activityLog';
import { HertzForbiddenError, HertzNotFoundError, HertzValidationError } from './hertzPostService';
import type { MemberSessionUser } from '../types/membership';

const REASONS = ['spam', 'misleading', 'abusive', 'off_topic', 'other'] as const;
type Reason = (typeof REASONS)[number];

function cleanReason(value: unknown): Reason {
  if (typeof value === 'string' && REASONS.includes(value as Reason)) return value as Reason;
  throw new HertzValidationError('Alasan report tidak valid');
}

function cleanDetails(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!text) return null;
  if (text.length > 1000) throw new HertzValidationError('Detail report maksimal 1000 karakter');
  return text;
}

export class HertzReportService {
  private readonly posts = new HertzPostRepository();
  private readonly logs = new ActivityLogService();

  async createPostReport(postId: string, user: MemberSessionUser | null, input: { reason?: unknown; details?: unknown }) {
    if (!user) throw new HertzForbiddenError('Login member diperlukan');
    const post = await this.posts.findById(postId, user.id);
    if (!post || post.status !== 'published' || post.deleted_at) throw new HertzNotFoundError();
    const reason = cleanReason(input.reason ?? 'other');
    const details = cleanDetails(input.details);
    return withTransaction(async (client) => {
      const report = await queryOne<{ id: string }>(
        `INSERT INTO hertz_reports (target_type, target_id, reporter_user_id, reason, details)
         VALUES ('post', $1, $2, $3, $4)
         RETURNING id`,
        [post.id, user.id, reason, details],
        client,
      );
      await this.logs.log({
        actor_id: user.id,
        actor_type: user.role === 'admin' ? 'admin' : 'member',
        action: 'hertz.post.reported',
        target_type: 'post',
        target_id: post.id,
        details: { report_id: report?.id ?? null, reason },
      }, client);
      return report;
    });
  }
}
