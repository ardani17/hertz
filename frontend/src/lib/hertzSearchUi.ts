export function getHertzHashtagHref(tag: string) {
  const normalized = tag.startsWith('#') ? tag : `#${tag}`;
  return `/hertz?q=${encodeURIComponent(normalized)}`;
}

export function getHertzSearchEmptyState(query: string) {
  return {
    title: 'Tidak ada hasil',
    body: `Belum ada post, member, topik, atau pair untuk "${query}".`,
  };
}

export function splitHertzHashtagText(text: string) {
  const parts: Array<{ type: 'text' | 'hashtag'; value: string }> = [];
  let cursor = 0;
  for (const match of text.matchAll(/#[A-Za-z0-9_]+/g)) {
    const index = match.index ?? 0;
    if (index > cursor) parts.push({ type: 'text', value: text.slice(cursor, index) });
    parts.push({ type: 'hashtag', value: match[0] });
    cursor = index + match[0].length;
  }
  if (cursor < text.length) parts.push({ type: 'text', value: text.slice(cursor) });
  return parts;
}
