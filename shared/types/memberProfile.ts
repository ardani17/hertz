export const SOCIAL_PLATFORMS = ['x', 'instagram', 'youtube', 'telegram', 'tradingview', 'linkedin'] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const TRADING_MARKETS = ['forex', 'crypto', 'stocks', 'commodities', 'indices', 'options'] as const;
export type TradingMarket = (typeof TRADING_MARKETS)[number];

export const TRADING_LEVELS = ['beginner', 'intermediate', 'advanced', 'professional'] as const;
export type TradingExperienceLevel = (typeof TRADING_LEVELS)[number];

export type MemberSocialLinks = Partial<Record<SocialPlatform, string>>;

export type MemberTradingProfile = {
  experienceLevel: TradingExperienceLevel | null;
  markets: TradingMarket[];
  sinceYear: number | null;
  style: string | null;
};

export type MemberPublicProfileDto = {
  bio: string | null;
  location: string | null;
  hobbies: string[];
  socialLinks: MemberSocialLinks;
  trading: MemberTradingProfile;
  updatedAt: string | null;
};

export type MemberPublicProfileInput = Partial<{
  bio: string | null;
  location: string | null;
  hobbies: string[];
  socialLinks: MemberSocialLinks;
  tradingExperienceLevel: TradingExperienceLevel | null;
  tradingMarkets: TradingMarket[];
  tradingSinceYear: number | null;
  tradingStyle: string | null;
}>;

const EMPTY_TRADING: MemberTradingProfile = {
  experienceLevel: null,
  markets: [],
  sinceYear: null,
  style: null,
};

export function parseTradingProfileJson(value: unknown): MemberTradingProfile {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { ...EMPTY_TRADING };
  const raw = value as Record<string, unknown>;
  const experienceLevel =
    typeof raw.experienceLevel === 'string' &&
    (TRADING_LEVELS as readonly string[]).includes(raw.experienceLevel)
      ? (raw.experienceLevel as TradingExperienceLevel)
      : null;
  const markets = Array.isArray(raw.markets)
    ? raw.markets.filter(
        (item): item is TradingMarket =>
          typeof item === 'string' && (TRADING_MARKETS as readonly string[]).includes(item),
      )
    : [];
  const sinceYear =
    typeof raw.sinceYear === 'number' && Number.isInteger(raw.sinceYear) ? raw.sinceYear : null;
  const style = typeof raw.style === 'string' && raw.style.trim() ? raw.style.trim() : null;
  return { experienceLevel, markets, sinceYear, style };
}

export function mapProfileRowToDto(row: {
  profile_bio: string | null;
  profile_location: string | null;
  profile_hobbies: unknown;
  profile_social_links: unknown;
  profile_trading: unknown;
  profile_updated_at: Date | null;
}): MemberPublicProfileDto {
  const hobbies = Array.isArray(row.profile_hobbies)
    ? row.profile_hobbies.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
  const socialRaw =
    row.profile_social_links && typeof row.profile_social_links === 'object' && !Array.isArray(row.profile_social_links)
      ? (row.profile_social_links as Record<string, unknown>)
      : {};
  const socialLinks: MemberSocialLinks = {};
  for (const platform of SOCIAL_PLATFORMS) {
    const handle = socialRaw[platform];
    if (typeof handle === 'string' && handle.trim()) socialLinks[platform] = handle.trim();
  }

  return {
    bio: row.profile_bio?.trim() || null,
    location: row.profile_location?.trim() || null,
    hobbies,
    socialLinks,
    trading: parseTradingProfileJson(row.profile_trading),
    updatedAt: row.profile_updated_at ? row.profile_updated_at.toISOString() : null,
  };
}

export const TRADING_LEVEL_LABELS: Record<TradingExperienceLevel, string> = {
  beginner: 'Pemula',
  intermediate: 'Menengah',
  advanced: 'Mahir',
  professional: 'Profesional',
};

export const TRADING_MARKET_LABELS: Record<TradingMarket, string> = {
  forex: 'Forex',
  crypto: 'Kripto',
  stocks: 'Saham',
  commodities: 'Komoditas',
  indices: 'Indeks',
  options: 'Opsi',
};
