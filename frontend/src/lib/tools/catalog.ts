export const LEFT_RAIL_STORAGE_KEY = 'hertz.leftRail.collapsed';
export const LEGACY_LEFT_RAIL_STORAGE_KEY = 'horizon.leftRail.collapsed';
export const TOOLS_HUB_PATH = '/tools';
export const TOOLS_ACTIVE_STORAGE_KEY = 'hertz.tools.active';
export const TOOLS_PENDING_STORAGE_KEY = 'hertz.tools.pending';
export const LEGACY_TOOLS_ACTIVE_STORAGE_KEY = 'horizon.tools.active';
export const LEGACY_TOOLS_PENDING_STORAGE_KEY = 'horizon.tools.pending';

export const LEFT_RAIL_WIDTH_EXPANDED = '256px';
export const LEFT_RAIL_WIDTH_COLLAPSED = '72px';

export type PublishedToolSlug =
  | 'pivot-point'
  | 'profitability'
  | 'challenge-tracker'
  | 'elliott-wave';

export type ToolCatalogEntry = {
  slug: PublishedToolSlug;
  href: `/tools/${PublishedToolSlug}`;
  navKey: 'pivotPoint' | 'profitability' | 'challengeTracker' | 'elliottWave';
  labelId: string;
  labelEn: string;
  hubLabelId: string;
  hubLabelEn: string;
  cardLabelId: string;
  cardLabelEn: string;
  summaryId: string;
  summaryEn: string;
  pointsId: string[];
  pointsEn: string[];
};

export const PUBLISHED_TOOLS: readonly ToolCatalogEntry[] = [
  {
    slug: 'pivot-point',
    href: '/tools/pivot-point',
    navKey: 'pivotPoint',
    labelId: 'Pivot Point',
    labelEn: 'Pivot Point',
    hubLabelId: 'Calculator',
    hubLabelEn: 'Calculator',
    cardLabelId: 'Pivot Point Calculator',
    cardLabelEn: 'Pivot Point Calculator',
    summaryId: 'Menghitung pivot, support, dan resistance dari data OHLC periode sebelumnya.',
    summaryEn: 'Calculate pivot, support, and resistance from previous-period OHLC data.',
    pointsId: ['Pivot', 'Support', 'Resistance'],
    pointsEn: ['Pivot', 'Support', 'Resistance'],
  },
  {
    slug: 'profitability',
    href: '/tools/profitability',
    navKey: 'profitability',
    labelId: 'Profitability',
    labelEn: 'Profitability',
    hubLabelId: 'Simulator',
    hubLabelEn: 'Simulator',
    cardLabelId: 'Profitability Simulator',
    cardLabelEn: 'Profitability Simulator',
    summaryId:
      'Simulasi Monte Carlo untuk membaca ekspektasi hasil trading dari risk, win rate, dan reward-risk.',
    summaryEn:
      'Monte Carlo simulation for expected trading outcomes from risk, win rate, and reward-risk.',
    pointsId: ['Monte Carlo', 'Drawdown', 'ROI'],
    pointsEn: ['Monte Carlo', 'Drawdown', 'ROI'],
  },
  {
    slug: 'challenge-tracker',
    href: '/tools/challenge-tracker',
    navKey: 'challengeTracker',
    labelId: 'Challenge Tracker',
    labelEn: 'Challenge Tracker',
    hubLabelId: 'Tracker',
    hubLabelEn: 'Tracker',
    cardLabelId: 'Challenge Tracker',
    cardLabelEn: 'Challenge Tracker',
    summaryId:
      'Pantau challenge trading nyata: target profit, drawdown, rules, jurnal manual, risk monitor, dan AI review context.',
    summaryEn:
      'Track live trading challenges: profit targets, drawdown, rules, manual journal, risk monitor, and AI review context.',
    pointsId: ['Member database', 'Journal & analytics', 'Risk monitor'],
    pointsEn: ['Member database', 'Journal & analytics', 'Risk monitor'],
  },
  {
    slug: 'elliott-wave',
    href: '/tools/elliott-wave',
    navKey: 'elliottWave',
    labelId: 'Elliott Wave',
    labelEn: 'Elliott Wave',
    hubLabelId: 'Calculator',
    hubLabelEn: 'Calculator',
    cardLabelId: 'Elliott Wave Calculator',
    cardLabelEn: 'Elliott Wave Calculator',
    summaryId:
      'Membuat level Elliott berbasis range sebelumnya dan menandai area buy/sell observasi.',
    summaryEn: 'Build Elliott levels from a prior range and mark observation buy/sell zones.',
    pointsId: ['Fibonacci', 'Wave levels', 'Setups'],
    pointsEn: ['Fibonacci', 'Wave levels', 'Setups'],
  },
] as const;

const PUBLISHED_HREFS = new Set(PUBLISHED_TOOLS.map((tool) => tool.href));

export function isPublishedToolPath(pathname: string): boolean {
  return PUBLISHED_HREFS.has(pathname as `/tools/${PublishedToolSlug}`);
}

export function getPublishedToolByPath(pathname: string): ToolCatalogEntry | undefined {
  return PUBLISHED_TOOLS.find((tool) => tool.href === pathname);
}

export function getPublishedToolBySlug(slug: string): ToolCatalogEntry | undefined {
  return PUBLISHED_TOOLS.find((tool) => tool.slug === slug);
}

export function readLeftRailCollapsed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const current = window.localStorage.getItem(LEFT_RAIL_STORAGE_KEY);
    const legacy = window.localStorage.getItem(LEGACY_LEFT_RAIL_STORAGE_KEY);
    if (current === null && legacy !== null) {
      window.localStorage.setItem(LEFT_RAIL_STORAGE_KEY, legacy);
      window.localStorage.removeItem(LEGACY_LEFT_RAIL_STORAGE_KEY);
      return legacy === '1';
    }
    return current === '1';
  } catch {
    return false;
  }
}

export function writeLeftRailCollapsed(collapsed: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LEFT_RAIL_STORAGE_KEY, collapsed ? '1' : '0');
    window.localStorage.removeItem(LEGACY_LEFT_RAIL_STORAGE_KEY);
  } catch {
    /* ignore quota errors */
  }
}
