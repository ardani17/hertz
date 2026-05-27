import { describe, expect, it } from 'vitest';
import {
  decodeCursor,
  decodeOffsetCursor,
  encodeCursor,
  encodeOffsetCursor,
} from '../../../shared/utils/cursor';

describe('cursor utils', () => {
  it('encodes and decodes createdAt/id cursor', () => {
    const encoded = encodeCursor({ createdAt: '2026-05-27T00:00:00.000Z', id: 'abc-123' });
    expect(decodeCursor(encoded)).toEqual({ createdAt: '2026-05-27T00:00:00.000Z', id: 'abc-123' });
  });

  it('encodes and decodes offset cursor', () => {
    const encoded = encodeOffsetCursor(20);
    expect(decodeOffsetCursor(encoded)).toBe(20);
  });
});
