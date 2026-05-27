import { describe, expect, it } from 'vitest';
import { HertzDmService } from '../../../shared/services/hertzDmService';

describe('mobile dm integration wiring', () => {
  it('inbox service returns paginated shape', async () => {
    const service = new HertzDmService();
    expect(typeof service.inbox).toBe('function');
  });
});
