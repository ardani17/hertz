export function listMessagesAfterId<T extends { id: string }>(messages: T[], afterId: string | null | undefined): T[] {
  if (!afterId) return messages;
  const index = messages.findIndex((message) => message.id === afterId);
  return index === -1 ? messages : messages.slice(index + 1);
}

export function appendIncrementalMessages<T extends { id: string }>(current: T[], incoming: T[]): T[] {
  const seen = new Set(current.map((message) => message.id));
  const merged = [...current];
  for (const message of incoming) {
    if (!seen.has(message.id)) {
      seen.add(message.id);
      merged.push(message);
    }
  }
  return merged;
}
