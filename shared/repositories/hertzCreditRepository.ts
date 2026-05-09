import { execute, query, queryOne, type DbClient } from '../db';
import type { HertzCreditSetting } from '../types/hertz';

export class HertzCreditRepository {
  async listSettings(client?: DbClient): Promise<HertzCreditSetting[]> {
    const result = await query<{
      key: string;
      amount: number;
      is_active: boolean;
      updated_at: Date;
    }>('SELECT * FROM hertz_credit_settings ORDER BY key ASC', [], client);
    return result.rows.map((row) => ({
      key: row.key,
      amount: Number(row.amount),
      isActive: row.is_active,
      updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
    }));
  }

  async getAmount(key: string, client?: DbClient): Promise<number> {
    const row = await queryOne<{ amount: number }>(
      'SELECT amount FROM hertz_credit_settings WHERE key = $1 AND is_active = true',
      [key],
      client,
    );
    return Number(row?.amount ?? 0);
  }

  async setAmount(key: string, amount: number, isActive: boolean, client?: DbClient): Promise<void> {
    await execute(
      `INSERT INTO hertz_credit_settings (key, amount, is_active, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (key)
       DO UPDATE SET amount = EXCLUDED.amount, is_active = EXCLUDED.is_active, updated_at = NOW()`,
      [key, amount, isActive],
      client,
    );
  }
}
