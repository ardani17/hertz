import { TYPING_TTL_MS, type TypingStatus } from './typing-utils';

type StoredTyping = TypingStatus;

const memoryStore = new Map<string, StoredTyping>();

function key(conversationId: string, userId: string) {
  return `typing:${conversationId}:${userId}`;
}

export async function setTypingStatus(input: {
  conversationId: string;
  userId: string;
  displayName: string;
}): Promise<void> {
  memoryStore.set(key(input.conversationId, input.userId), {
    userId: input.userId,
    displayName: input.displayName,
    lastTypingAt: Date.now(),
  });
}

export async function clearTypingStatus(conversationId: string, userId: string): Promise<void> {
  memoryStore.delete(key(conversationId, userId));
}

export async function listTypingStatuses(conversationId: string, selfUserId: string): Promise<StoredTyping[]> {
  const prefix = `typing:${conversationId}:`;
  const now = Date.now();
  const rows: StoredTyping[] = [];
  for (const [storeKey, status] of memoryStore.entries()) {
    if (!storeKey.startsWith(prefix)) continue;
    if (status.userId === selfUserId) continue;
    if (now - status.lastTypingAt > TYPING_TTL_MS) {
      memoryStore.delete(storeKey);
      continue;
    }
    rows.push(status);
  }
  return rows;
}
