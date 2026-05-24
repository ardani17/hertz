import { SOCIAL_PLATFORMS, type SocialPlatform } from '../types/memberProfile';

const PLATFORM_URL_BUILDERS: Record<SocialPlatform, (handle: string) => string> = {
  x: (handle) => `https://x.com/${encodeURIComponent(handle)}`,
  instagram: (handle) => `https://instagram.com/${encodeURIComponent(handle)}`,
  youtube: (handle) => `https://youtube.com/@${encodeURIComponent(handle)}`,
  telegram: (handle) => `https://t.me/${encodeURIComponent(handle)}`,
  tradingview: (handle) => `https://www.tradingview.com/u/${encodeURIComponent(handle)}/`,
  linkedin: (handle) => `https://www.linkedin.com/in/${encodeURIComponent(handle)}/`,
};

export function buildSocialUrl(platform: SocialPlatform, handle: string): string {
  return PLATFORM_URL_BUILDERS[platform](handle);
}

export function isSocialPlatform(value: string): value is SocialPlatform {
  return (SOCIAL_PLATFORMS as readonly string[]).includes(value);
}

export const SOCIAL_PLATFORM_LABELS: Record<SocialPlatform, string> = {
  x: 'X',
  instagram: 'Instagram',
  youtube: 'YouTube',
  telegram: 'Telegram',
  tradingview: 'TradingView',
  linkedin: 'LinkedIn',
};
