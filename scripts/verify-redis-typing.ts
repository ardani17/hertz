import { clearTypingStatus, listTypingStatuses, setTypingStatus } from '../frontend/src/lib/redis';

async function main() {
  const conversationId = '00000000-0000-4000-8000-000000000001';
  const userId = '00000000-0000-4000-8000-000000000002';
  const viewerId = '00000000-0000-4000-8000-000000000099';

  await setTypingStatus({ conversationId, userId, displayName: 'Redis Tester' });
  const listed = await listTypingStatuses(conversationId, viewerId);
  console.log('listed', listed);
  await clearTypingStatus(conversationId, userId);
  const cleared = await listTypingStatuses(conversationId, viewerId);
  console.log('cleared', cleared);
  if (listed.length !== 1 || cleared.length !== 0) process.exit(1);
  console.log('OK: Redis typing store');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
