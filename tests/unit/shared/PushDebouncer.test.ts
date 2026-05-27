import { describe, expect, it } from 'vitest';
import { PushDebouncer } from '../../../shared/infra/PushDebouncer';

describe('PushDebouncer', () => {
  it('allows the first send and blocks the second send inside the window', async () => {
    const debouncer = new PushDebouncer();
    const key = `test:push:${Date.now()}:${Math.random()}`;

    await expect(debouncer.shouldSend(key, 60)).resolves.toBe(true);
    await expect(debouncer.shouldSend(key, 60)).resolves.toBe(false);
  });

  it('allows the key again after the memory window expires', async () => {
    const debouncer = new PushDebouncer();
    const key = `test:push:${Date.now()}:${Math.random()}`;

    await expect(debouncer.shouldSend(key, 0)).resolves.toBe(true);
    await expect(debouncer.shouldSend(key, 0)).resolves.toBe(true);
  });
});
