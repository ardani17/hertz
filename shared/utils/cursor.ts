export interface CursorPayload {
  createdAt: string;
  id: string;
}

export interface OffsetCursorPayload {
  offset: number;
}

export function encodeCursor(row: { createdAt: Date | string; id: string }): string {
  return Buffer.from(JSON.stringify({
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    id: row.id,
  })).toString('base64url');
}

export function decodeCursor(cursor: string | null | undefined): CursorPayload | null {
  if (!cursor) return null;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as { createdAt?: string; id?: string };
    return parsed.createdAt && parsed.id ? { createdAt: parsed.createdAt, id: parsed.id } : null;
  } catch {
    return null;
  }
}

export function encodeOffsetCursor(offset: number): string {
  return Buffer.from(JSON.stringify({ offset: Math.max(0, Math.floor(offset)) })).toString('base64url');
}

export function decodeOffsetCursor(cursor: string | null | undefined): number {
  if (!cursor) return 0;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as OffsetCursorPayload;
    return Number.isFinite(parsed.offset) && parsed.offset >= 0 ? Math.floor(parsed.offset) : 0;
  } catch {
    return 0;
  }
}

export function clampLimit(value: number | undefined, fallback: number, max: number): number {
  return Math.min(Math.max(value ?? fallback, 1), max);
}
