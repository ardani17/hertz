import { queryOne } from '../db';
import { buildTradingProfileJson, sanitizeMemberProfileInput } from '../lib/memberProfileValidation';
import {
  mapProfileRowToDto,
  parseTradingProfileJson,
  type MemberPublicProfileDto,
} from '../types/memberProfile';
import { HertzValidationError } from './hertzPostService';

type ProfileRow = {
  profile_bio: string | null;
  profile_location: string | null;
  profile_hobbies: unknown;
  profile_social_links: unknown;
  profile_trading: unknown;
  profile_updated_at: Date | null;
};

const PROFILE_SELECT = `profile_bio, profile_location, profile_hobbies, profile_social_links, profile_trading, profile_updated_at`;

export class HertzMemberProfileService {
  async getOwnProfile(userId: string): Promise<MemberPublicProfileDto> {
    const row = await queryOne<ProfileRow>(
      `SELECT ${PROFILE_SELECT} FROM users WHERE id = $1 AND verified_member_at IS NOT NULL LIMIT 1`,
      [userId],
    );
    if (!row) throw new HertzValidationError('Profil member tidak ditemukan');
    return mapProfileRowToDto(row);
  }

  async updateOwnProfile(userId: string, body: unknown): Promise<MemberPublicProfileDto> {
    const input = sanitizeMemberProfileInput(body);
    const existing = await queryOne<ProfileRow>(
      `SELECT ${PROFILE_SELECT} FROM users WHERE id = $1 AND verified_member_at IS NOT NULL LIMIT 1`,
      [userId],
    );
    if (!existing) throw new HertzValidationError('Profil member tidak ditemukan');

    const sets: string[] = ['profile_updated_at = NOW()'];
    const params: unknown[] = [userId];
    let paramIndex = 2;

    if (input.bio !== undefined) {
      sets.push(`profile_bio = $${paramIndex++}`);
      params.push(input.bio);
    }
    if (input.location !== undefined) {
      sets.push(`profile_location = $${paramIndex++}`);
      params.push(input.location);
    }
    if (input.hobbies !== undefined) {
      sets.push(`profile_hobbies = $${paramIndex++}::jsonb`);
      params.push(JSON.stringify(input.hobbies));
    }
    if (input.socialLinks !== undefined) {
      sets.push(`profile_social_links = $${paramIndex++}::jsonb`);
      params.push(JSON.stringify(input.socialLinks));
    }

    const tradingPatch = buildTradingProfileJson(input);
    if (tradingPatch) {
      const current = parseTradingProfileJson(existing.profile_trading);
      const merged = {
        experienceLevel:
          input.tradingExperienceLevel !== undefined ? input.tradingExperienceLevel : current.experienceLevel,
        markets: input.tradingMarkets !== undefined ? input.tradingMarkets : current.markets,
        sinceYear: input.tradingSinceYear !== undefined ? input.tradingSinceYear : current.sinceYear,
        style: input.tradingStyle !== undefined ? input.tradingStyle : current.style,
      };
      sets.push(`profile_trading = $${paramIndex++}::jsonb`);
      params.push(JSON.stringify(merged));
    }

    await queryOne(
      `UPDATE users SET ${sets.join(', ')} WHERE id = $1 AND verified_member_at IS NOT NULL RETURNING id`,
      params,
    );

    return this.getOwnProfile(userId);
  }
}
