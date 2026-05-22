export type PublicProfileSource = {
  id: string;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
  bio?: string | null;
};

export type PublicProfileDto = {
  id: string;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  counters: { postCount: number; pulseCount: number };
};

const USERNAME_AT = /^@[a-zA-Z0-9_\.]{2,32}$/;
const USERNAME_PLAIN = /^[a-zA-Z0-9_\.]{2,32}$/;

/** Reserved path segments — must not be treated as public profile usernames. */
const RESERVED_USERNAMES = new Set([
  'admin',
  'api',
  'artikel',
  'blog',
  'gallery',
  'hertz',
  'outlook',
  'post',
  'tools',
  '_next',
]);

function decodeProfileSegment(segment: string): string {
  const trimmed = segment.trim();
  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}

export function parsePublicProfileSegment(segment: string | string[] | undefined): string | null {
  if (typeof segment !== 'string') return null;
  const decoded = decodeProfileSegment(segment);
  let username: string | null = null;
  if (USERNAME_AT.test(decoded)) {
    username = decoded.slice(1);
  } else if (USERNAME_PLAIN.test(decoded)) {
    username = decoded;
  }
  if (!username) return null;
  const normalized = username.toLowerCase();
  if (RESERVED_USERNAMES.has(normalized)) return null;
  return normalized;
}

export function mapPublicProfileDto(row: PublicProfileSource, counters: { postCount: number; pulseCount: number }): PublicProfileDto {
  return {
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
    bio: row.bio ?? null,
    counters: {
      postCount: Math.max(0, Math.trunc(counters.postCount)),
      pulseCount: Math.max(0, Math.trunc(counters.pulseCount)),
    },
  };
}
