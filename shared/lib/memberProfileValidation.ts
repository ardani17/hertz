import { HertzValidationError } from '../services/hertzPostService';
import {
  SOCIAL_PLATFORMS,
  TRADING_LEVELS,
  TRADING_MARKETS,
  type MemberPublicProfileInput,
  type MemberSocialLinks,
  type SocialPlatform,
  type TradingExperienceLevel,
  type TradingMarket,
} from '../types/memberProfile';

const BIO_MAX = 280;
const LOCATION_MAX = 80;
const HOBBY_MAX = 8;
const HOBBY_ITEM_MAX = 40;
const HANDLE_MAX = 50;
const TRADING_STYLE_MAX = 120;
const HANDLE_PATTERN = /^[a-zA-Z0-9_.-]+$/;
const TRADING_YEAR_MIN = 1990;

function normalizeOptionalText(value: unknown, max: number, label: string): string | null {
  if (value === undefined) return undefined as never;
  if (value === null) return null;
  if (typeof value !== 'string') throw new HertzValidationError(`${label} tidak valid`);
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > max) throw new HertzValidationError(`${label} maksimal ${max} karakter`);
  return trimmed;
}

function normalizeHobbies(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) throw new HertzValidationError('Hobi tidak valid');
  if (value.length > HOBBY_MAX) throw new HertzValidationError(`Maksimal ${HOBBY_MAX} hobi`);
  const seen = new Set<string>();
  const hobbies: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') throw new HertzValidationError('Hobi tidak valid');
    const trimmed = item.trim();
    if (!trimmed) continue;
    if (trimmed.length > HOBBY_ITEM_MAX) {
      throw new HertzValidationError(`Setiap hobi maksimal ${HOBBY_ITEM_MAX} karakter`);
    }
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    hobbies.push(trimmed);
  }
  return hobbies;
}

function normalizeSocialHandle(value: unknown, platform: SocialPlatform): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') throw new HertzValidationError(`Handle ${platform} tidak valid`);
  const trimmed = value.trim().replace(/^@+/, '');
  if (!trimmed) return undefined;
  if (trimmed.length > HANDLE_MAX) {
    throw new HertzValidationError(`Handle ${platform} maksimal ${HANDLE_MAX} karakter`);
  }
  if (!HANDLE_PATTERN.test(trimmed)) {
    throw new HertzValidationError(`Handle ${platform} hanya boleh huruf, angka, titik, strip, dan underscore`);
  }
  return trimmed;
}

function normalizeSocialLinks(value: unknown): MemberSocialLinks | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new HertzValidationError('Link sosial media tidak valid');
  }
  const raw = value as Record<string, unknown>;
  for (const key of Object.keys(raw)) {
    if (!(SOCIAL_PLATFORMS as readonly string[]).includes(key)) {
      throw new HertzValidationError(`Platform sosial "${key}" tidak didukung`);
    }
  }
  const links: MemberSocialLinks = {};
  for (const platform of SOCIAL_PLATFORMS) {
    if (!(platform in raw)) continue;
    const handle = normalizeSocialHandle(raw[platform], platform);
    if (handle) links[platform] = handle;
  }
  return links;
}

function normalizeTradingLevel(value: unknown): TradingExperienceLevel | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value !== 'string' || !(TRADING_LEVELS as readonly string[]).includes(value)) {
    throw new HertzValidationError('Level pengalaman trading tidak valid');
  }
  return value as TradingExperienceLevel;
}

function normalizeTradingMarkets(value: unknown): TradingMarket[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) throw new HertzValidationError('Pasar trading tidak valid');
  if (value.length > 5) throw new HertzValidationError('Maksimal 5 pasar trading');
  const seen = new Set<TradingMarket>();
  for (const item of value) {
    if (typeof item !== 'string' || !(TRADING_MARKETS as readonly string[]).includes(item)) {
      throw new HertzValidationError('Pasar trading tidak valid');
    }
    seen.add(item as TradingMarket);
  }
  return [...seen];
}

function normalizeTradingYear(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const year = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(year)) throw new HertzValidationError('Tahun mulai trading tidak valid');
  const currentYear = new Date().getFullYear();
  if (year < TRADING_YEAR_MIN || year > currentYear) {
    throw new HertzValidationError(`Tahun mulai trading harus antara ${TRADING_YEAR_MIN} dan ${currentYear}`);
  }
  return year;
}

export function sanitizeMemberProfileInput(body: unknown): MemberPublicProfileInput {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new HertzValidationError('Data profil tidak valid');
  }
  const input = body as Record<string, unknown>;
  const result: MemberPublicProfileInput = {};

  if ('bio' in input) result.bio = normalizeOptionalText(input.bio, BIO_MAX, 'Bio');
  if ('location' in input) result.location = normalizeOptionalText(input.location, LOCATION_MAX, 'Lokasi');
  if ('hobbies' in input) result.hobbies = normalizeHobbies(input.hobbies);
  if ('socialLinks' in input) result.socialLinks = normalizeSocialLinks(input.socialLinks);
  if ('tradingExperienceLevel' in input) {
    result.tradingExperienceLevel = normalizeTradingLevel(input.tradingExperienceLevel);
  }
  if ('tradingMarkets' in input) result.tradingMarkets = normalizeTradingMarkets(input.tradingMarkets);
  if ('tradingSinceYear' in input) result.tradingSinceYear = normalizeTradingYear(input.tradingSinceYear);
  if ('tradingStyle' in input) {
    result.tradingStyle = normalizeOptionalText(input.tradingStyle, TRADING_STYLE_MAX, 'Gaya trading');
  }

  if (Object.keys(result).length === 0) {
    throw new HertzValidationError('Tidak ada field profil yang diperbarui');
  }

  return result;
}

export function buildTradingProfileJson(input: MemberPublicProfileInput): Record<string, unknown> | undefined {
  const hasTradingField =
    input.tradingExperienceLevel !== undefined ||
    input.tradingMarkets !== undefined ||
    input.tradingSinceYear !== undefined ||
    input.tradingStyle !== undefined;
  if (!hasTradingField) return undefined;

  return {
    experienceLevel: input.tradingExperienceLevel ?? null,
    markets: input.tradingMarkets ?? [],
    sinceYear: input.tradingSinceYear ?? null,
    style: input.tradingStyle ?? null,
  };
}
