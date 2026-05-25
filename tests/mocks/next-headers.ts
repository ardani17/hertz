import { vi } from 'vitest';

export const cookies = vi.fn(async () => ({
  get: vi.fn(),
  set: vi.fn(),
}));
