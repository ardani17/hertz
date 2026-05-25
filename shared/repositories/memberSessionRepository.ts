import { execute, queryOne, type DbClient } from '../db';

export interface MemberSessionRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
  last_used_at: Date | null;
}

export class MemberSessionRepository {
  async create(params: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }, client?: DbClient): Promise<void> {
    await execute(
      `INSERT INTO hertz_member_sessions (user_id, token_hash, expires_at, last_used_at)
       VALUES ($1, $2, $3, NOW())`,
      [params.userId, params.tokenHash, params.expiresAt.toISOString()],
      client,
    );
  }

  async findByTokenHash(tokenHash: string, client?: DbClient): Promise<MemberSessionRow | null> {
    return queryOne<MemberSessionRow>(
      `SELECT id, user_id, token_hash, expires_at, created_at, last_used_at
       FROM hertz_member_sessions
       WHERE token_hash = $1`,
      [tokenHash],
      client,
    );
  }

  async touchAndExtend(id: string, expiresAt: Date, client?: DbClient): Promise<void> {
    await execute(
      `UPDATE hertz_member_sessions
       SET last_used_at = NOW(), expires_at = $2
       WHERE id = $1`,
      [id, expiresAt.toISOString()],
      client,
    );
  }

  async deleteByTokenHash(tokenHash: string, client?: DbClient): Promise<void> {
    await execute(
      'DELETE FROM hertz_member_sessions WHERE token_hash = $1',
      [tokenHash],
      client,
    );
  }

  async deleteExpired(client?: DbClient): Promise<void> {
    await execute(
      'DELETE FROM hertz_member_sessions WHERE expires_at < NOW()',
      [],
      client,
    );
  }
}
