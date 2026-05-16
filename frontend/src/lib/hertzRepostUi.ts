type RepostCandidate = {
  id: string;
  shortId?: string;
  type: string;
  author?: { name?: string | null } | null;
  quotedPost?: { shortId?: string | null } | null;
};

export function isPlainRepostTimelineItem(post: RepostCandidate): boolean {
  return post.type === 'repost' && Boolean(post.quotedPost);
}

export function getPlainRepostLabel(post: RepostCandidate): string {
  const name = post.author?.name?.trim();
  return name ? `${name} merepost` : 'Merepost';
}

export function getRepostTimelineKey(post: RepostCandidate): string {
  if (!isPlainRepostTimelineItem(post)) return `post:${post.id}`;
  return `repost:${post.id}:${post.quotedPost?.shortId ?? post.shortId ?? 'original'}`;
}
