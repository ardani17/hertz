/** Pure throttle helper for typing emit (Property 4). */
export function shouldEmitThrottled(lastEmitAt: number | null, now: number, minIntervalMs: number): boolean {
  return lastEmitAt === null || now - lastEmitAt >= minIntervalMs;
}

export function createThrottleEmitter(minIntervalMs: number) {
  let lastEmitAt: number | null = null;
  return {
    shouldEmit(now: number = Date.now()) {
      if (!shouldEmitThrottled(lastEmitAt, now, minIntervalMs)) return false;
      lastEmitAt = now;
      return true;
    },
    reset() {
      lastEmitAt = null;
    },
  };
}
