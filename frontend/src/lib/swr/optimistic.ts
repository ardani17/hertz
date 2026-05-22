export function mergeOptimisticList<T extends { id: string }>(
  current: T[] | undefined,
  entity: T,
  options: { optimisticId?: string } = {},
): T[] {
  const list = [...(current ?? [])];
  const removeIds = new Set([entity.id, options.optimisticId].filter(Boolean) as string[]);
  const filtered = list.filter((item) => !removeIds.has(item.id));
  return [...filtered, entity];
}

export function rollbackOptimisticValue<T>(previous: T): T {
  return previous;
}

export async function withOptimistic<T>(options: {
  snapshot: T;
  apply: (value: T) => T;
  commit: () => Promise<T>;
  onUpdate: (value: T) => void;
  onRollback?: (value: T) => void;
}): Promise<T> {
  const optimistic = options.apply(options.snapshot);
  options.onUpdate(optimistic);
  try {
    const canonical = await options.commit();
    options.onUpdate(canonical);
    return canonical;
  } catch (error) {
    options.onUpdate(options.snapshot);
    options.onRollback?.(options.snapshot);
    throw error;
  }
}
