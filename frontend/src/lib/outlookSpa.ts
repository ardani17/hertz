const OUTLOOK_PATH = /^\/outlook\/([^/]+)\/?$/;

export function parseOutlookArticlePathname(pathname: string): string | null {
  const match = OUTLOOK_PATH.exec(pathname);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export function buildOutlookArticlePath(slug: string): string {
  return `/outlook/${encodeURIComponent(slug)}`;
}

export function hasLegacyOutlookArticleQuery(search: string): boolean {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  return Boolean(params.get('article')?.trim());
}

export function parseLegacyOutlookArticleQuery(search: string): string | null {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  return params.get('article')?.trim() || null;
}
