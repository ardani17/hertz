import { query } from '../db';

const MENTION_PATTERN = /(^|[\s(])@([A-Za-z0-9_]{3,32})\b/g;

export function extractMentionUsernames(text: string): string[] {
  const usernames = new Set<string>();
  for (const match of text.matchAll(MENTION_PATTERN)) {
    usernames.add(match[2].toLowerCase());
  }
  return Array.from(usernames);
}

export async function resolveMentionedUserIds(text: string): Promise<string[]> {
  const usernames = extractMentionUsernames(text);
  if (usernames.length === 0) return [];
  const result = await query<{ id: string }>(
    `SELECT id
     FROM users
     WHERE verified_member_at IS NOT NULL
       AND LOWER(username) = ANY($1::text[])`,
    [usernames],
  );
  return result.rows.map((row) => row.id);
}

