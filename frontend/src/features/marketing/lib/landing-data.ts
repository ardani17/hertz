import { HertzPostService } from '@shared/services/hertzPostService';
import type { HertzPost } from '@shared/types';
import { getMarketRailGroups } from '@/lib/globalDataMarket';
import type { MarketRailGroup } from '@/lib/globalDataMarket';

export async function getLandingPreviewPost(): Promise<HertzPost | null> {
  try {
    const feed = new HertzPostService();
    const result = await feed.listFeed({ limit: 1, sort: 'latest' });
    return result.items[0] ?? null;
  } catch {
    return null;
  }
}

export async function getLandingMarketGroups(): Promise<MarketRailGroup[]> {
  try {
    return await getMarketRailGroups();
  } catch {
    return [];
  }
}

export function getForexHeroModel(groups: MarketRailGroup[]) {
  const group = groups.find((g) => g.title === 'Forex Market');
  const rows = group?.rows ?? [];
  const heroAsset = rows.find((row) => row.symbol === 'XAUUSD') ?? rows[0] ?? null;
  const supportingRows = rows.filter((row) => row.symbol !== heroAsset?.symbol).slice(0, 3);
  return { group, heroAsset, supportingRows };
}

export function previewPostLine(post: HertzPost | null) {
  if (!post) return 'HERTZ feed aktif untuk setup, jurnal, dan diskusi member.';
  const handle = post.author.username ? `@${post.author.username}` : post.author.name;
  return `${handle}: ${post.content.text}`;
}
