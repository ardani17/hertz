export function createDedupeFetcher<T>(loader: (key: string) => Promise<T>): (key: string) => Promise<T> {
  const inFlight = new Map<string, Promise<T>>();
  return async (key: string) => {
    const existing = inFlight.get(key);
    if (existing) return existing;
    const promise = loader(key).finally(() => inFlight.delete(key));
    inFlight.set(key, promise);
    return promise;
  };
}
