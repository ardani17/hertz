export function formatHertzAuthorHandle(username: string | null | undefined) {
  const normalized = username?.trim().replace(/^@+/, '');
  return normalized ? `@${normalized}` : '@member';
}
