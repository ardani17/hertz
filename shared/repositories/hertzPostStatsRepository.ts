import { execute, query, type DbClient } from '../db';

export type HertzPostStatsField = 'comment_count' | 'pulse_count' | 'repost_count' | 'view_count';

export type HertzPostStatsCounts = Record<HertzPostStatsField, number>;

export type CounterEvent = { eventId?: string; field: HertzPostStatsField; delta: number };

export function applyCounterEvents(initial: HertzPostStatsCounts, events: CounterEvent[]) {
  const seen = new Set<string>();
  const counts: HertzPostStatsCounts = { ...initial };
  for (const event of events) {
    const eventId = event.eventId;
    if (eventId) {
      if (seen.has(eventId)) continue;
      seen.add(eventId);
    }
    counts[event.field] = Math.max(0, counts[event.field] + event.delta);
  }
  return { counts, seenEventIds: seen };
}

export class HertzPostStatsRepository {
  async getMany(postIds: string[], client?: DbClient): Promise<Map<string, HertzPostStatsCounts>> {
    if (postIds.length === 0) return new Map();
    try {
      return await this.getManyUnsafe(postIds, client);
    } catch (error) {
      if ((error as { code?: string }).code === '42P01') return new Map();
      throw error;
    }
  }

  private async getManyUnsafe(postIds: string[], client?: DbClient): Promise<Map<string, HertzPostStatsCounts>> {
    const result = await query<{ post_id: string } & HertzPostStatsCounts>(
      `SELECT post_id, comment_count, pulse_count, repost_count, view_count
       FROM hertz_post_stats
       WHERE post_id = ANY($1::uuid[])`,
      [postIds],
      client,
    );
    return new Map(result.rows.map((row) => [row.post_id, {
      comment_count: Number(row.comment_count),
      pulse_count: Number(row.pulse_count),
      repost_count: Number(row.repost_count),
      view_count: Number(row.view_count),
    }]));
  }

  async upsert(postId: string, counts: Partial<HertzPostStatsCounts>, client?: DbClient): Promise<void> {
    await execute(
      `INSERT INTO hertz_post_stats (post_id, comment_count, pulse_count, repost_count, view_count, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (post_id) DO UPDATE SET
         comment_count = GREATEST(0, EXCLUDED.comment_count),
         pulse_count = GREATEST(0, EXCLUDED.pulse_count),
         repost_count = GREATEST(0, EXCLUDED.repost_count),
         view_count = GREATEST(0, EXCLUDED.view_count),
         updated_at = NOW()`,
      [postId, counts.comment_count ?? 0, counts.pulse_count ?? 0, counts.repost_count ?? 0, counts.view_count ?? 0],
      client,
    );
  }

  async ensureCanonicalForPosts(postIds: string[], client?: DbClient): Promise<void> {
    const unique = [...new Set(postIds)];
    if (unique.length === 0) return;
    const cached = await this.getMany(unique, client);
    const missing = unique.filter((postId) => !cached.has(postId));
    for (const postId of missing) {
      const canonical = await query<{
        comment_count: string;
        pulse_count: string;
        repost_count: string;
        view_count: string;
      }>(
        `SELECT
           (SELECT COUNT(*)::text FROM hertz_comments c WHERE c.post_id = $1 AND c.status = 'visible' AND c.deleted_at IS NULL) AS comment_count,
           (SELECT COUNT(*)::text FROM hertz_reactions r WHERE r.post_id = $1 AND r.type = 'pulse' AND r.deleted_at IS NULL) AS pulse_count,
           (SELECT COUNT(*)::text FROM hertz_reposts rp WHERE rp.original_post_id = $1 AND rp.deleted_at IS NULL) AS repost_count,
           (SELECT COUNT(*)::text FROM hertz_views v WHERE v.post_id = $1) AS view_count`,
        [postId],
        client,
      );
      const row = canonical.rows[0];
      if (!row) continue;
      await this.upsert(postId, {
        comment_count: Number(row.comment_count),
        pulse_count: Number(row.pulse_count),
        repost_count: Number(row.repost_count),
        view_count: Number(row.view_count),
      }, client);
    }
  }

  async incr(postId: string, field: HertzPostStatsField, delta: number, _options: { eventId?: string } = {}, client?: DbClient): Promise<void> {
    const columns: HertzPostStatsField[] = ['comment_count', 'pulse_count', 'repost_count', 'view_count'];
    if (!columns.includes(field)) throw new Error(`Invalid counter field: ${field}`);
    try {
      await this.incrUnsafe(postId, field, delta, client);
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === '42P01' || code === '23503') return;
      throw error;
    }
  }

  private async incrUnsafe(postId: string, field: HertzPostStatsField, delta: number, client?: DbClient): Promise<void> {
    await execute(
      `INSERT INTO hertz_post_stats (post_id, ${field}, updated_at)
       VALUES ($1, GREATEST(0, $2::integer), NOW())
       ON CONFLICT (post_id) DO UPDATE SET
         ${field} = GREATEST(0, hertz_post_stats.${field} + $2::integer),
         updated_at = NOW()`,
      [postId, delta],
      client,
    );
  }
}
