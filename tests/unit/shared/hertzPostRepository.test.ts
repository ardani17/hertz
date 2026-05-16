import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@shared/db', () => ({
  execute: vi.fn(),
  query: vi.fn(),
  queryOne: vi.fn(),
}));

import { execute } from '@shared/db';
import { HertzPostRepository } from '../../../shared/repositories/hertzPostRepository';

const mockExecute = vi.mocked(execute);

describe('HertzPostRepository', () => {
  beforeEach(() => {
    mockExecute.mockReset();
    mockExecute.mockResolvedValue(1);
  });

  it('casts the status parameter consistently when updating status', async () => {
    const repository = new HertzPostRepository();

    await repository.updateStatus('post-id', 'deleted');

    const [sql, values] = mockExecute.mock.calls[0];
    expect(sql).toContain('status = $2::varchar');
    expect(sql).toContain("CASE WHEN $2::varchar = 'deleted'");
    expect(values).toEqual(['post-id', 'deleted']);
  });
});
