export const TYPING_TTL_MS = 6_000;
export const TYPING_EMIT_MIN_MS = 1_500;
export const TYPING_EMIT_MAX_MS = 2_000;

export type TypingStatus = {
  userId: string;
  displayName: string;
  lastTypingAt: number;
};

export function createTypingThrottleSchedule(inputTimes: number[]): number[] {
  const times = [...new Set(inputTimes)].filter((time) => Number.isFinite(time) && time >= 0).sort((a, b) => a - b);
  const emitted: number[] = [];
  for (const time of times) {
    const previous = emitted.at(-1);
    if (previous === undefined || time - previous >= TYPING_EMIT_MIN_MS) {
      emitted.push(time);
    }
  }
  return emitted;
}

export function shouldEmitTyping(lastEmitAt: number | null, now: number): boolean {
  return lastEmitAt === null || now - lastEmitAt >= TYPING_EMIT_MIN_MS;
}

export function filterActiveTypingStatuses<T extends TypingStatus>(
  statuses: T[],
  options: { now: number; selfUserId: string; limit?: number },
): T[] {
  const limit = options.limit ?? 3;
  const byUser = new Map<string, T>();
  for (const status of statuses) {
    if (status.userId === options.selfUserId) continue;
    if (status.lastTypingAt > options.now) continue;
    if (options.now - status.lastTypingAt > TYPING_TTL_MS) continue;
    const existing = byUser.get(status.userId);
    if (!existing || status.lastTypingAt > existing.lastTypingAt) byUser.set(status.userId, status);
  }
  return [...byUser.values()].sort((a, b) => b.lastTypingAt - a.lastTypingAt).slice(0, limit);
}

export function formatTypingIndicator(statuses: Pick<TypingStatus, 'displayName'>[]): string | null {
  if (statuses.length === 0) return null;
  if (statuses.length === 1) return `${statuses[0].displayName} sedang mengetik…`;
  if (statuses.length === 2) return `${statuses[0].displayName} dan ${statuses[1].displayName} sedang mengetik…`;
  return `${statuses[0].displayName} dan ${statuses.length - 1} lainnya sedang mengetik…`;
}
