const POST_PATH = /^\/hertz\/post\/([a-zA-Z0-9_-]+)\/?$/;

export function parseHertzPostPathname(pathname: string): string | null {
  const match = POST_PATH.exec(pathname);
  return match?.[1] ?? null;
}

export function buildHertzPostPath(shortId: string): string {
  return `/hertz/post/${shortId}`;
}

export function getPublicProfileBasePath(username: string): string {
  return `/@${username}`;
}

export function buildPublicProfilePostUrl(username: string, shortId: string): string {
  const params = new URLSearchParams({ post: shortId });
  return `${getPublicProfileBasePath(username)}?${params.toString()}`;
}

export function hasLegacyHertzPostQuery(search: string): boolean {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const post = params.get('post')?.trim();
  return Boolean(post);
}

export function parseLegacyHertzPostQuery(search: string): string | null {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  return params.get('post')?.trim() || null;
}

export function stripLegacyHertzPostQuery(search: string): string {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  params.delete('post');
  const next = params.toString();
  return next ? `?${next}` : '';
}
