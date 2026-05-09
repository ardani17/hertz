import { withTransaction } from '../db';
import { HertzCommunityNoteRepository } from '../repositories/hertzCommunityNoteRepository';
import { HertzPostRepository } from '../repositories/hertzPostRepository';
import { ActivityLogService } from './activityLog';
import { HertzForbiddenError, HertzNotFoundError, HertzValidationError } from './hertzPostService';
import type { CommunityNoteInput, CommunityNoteRatingValue, CommunityNoteSourceInput } from '../types/communityNote';
import type { MemberSessionUser } from '../types/membership';

const NOTE_EDIT_WINDOW_MS = 10 * 60 * 1000;

function cleanNoteContent(content: unknown): string {
  const text = typeof content === 'string' ? content.trim() : '';
  if (!text) throw new HertzValidationError('Catatan komunitas tidak boleh kosong');
  if (text.length > 4000) throw new HertzValidationError('Catatan komunitas maksimal 4000 karakter');
  return text;
}

function validateSources(sources: unknown): CommunityNoteSourceInput[] {
  if (!Array.isArray(sources) || sources.length === 0) {
    throw new HertzValidationError('Community note wajib memiliki minimal satu source URL');
  }
  return sources.map((source) => {
    if (!source || typeof source !== 'object') throw new HertzValidationError('Source tidak valid');
    const record = source as Record<string, unknown>;
    const url = typeof record.url === 'string' ? record.url.trim() : '';
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('invalid');
    } catch {
      throw new HertzValidationError('Source URL tidak valid');
    }
    return {
      url,
      title: typeof record.title === 'string' && record.title.trim() ? record.title.trim().slice(0, 500) : null,
    };
  });
}

export class HertzCommunityNoteService {
  private readonly notes = new HertzCommunityNoteRepository();
  private readonly posts = new HertzPostRepository();
  private readonly logs = new ActivityLogService();

  async create(postId: string, user: MemberSessionUser | null, input: CommunityNoteInput) {
    if (!user) throw new HertzForbiddenError('Login member diperlukan');
    const content = cleanNoteContent(input.content);
    const sources = validateSources(input.sources);
    const resolvedPostId = await this.posts.resolvePostId(postId);
    if (!resolvedPostId) throw new HertzNotFoundError('Post tidak ditemukan');
    return withTransaction(async (client) => {
      const note = await this.notes.create(resolvedPostId, user.id, content, sources, client);
      await this.logs.log({
        actor_id: user.id,
        actor_type: user.role === 'admin' ? 'admin' : 'member',
        action: 'hertz.community_note.created',
        target_type: 'community_note',
        target_id: note.id,
        details: { post_id: resolvedPostId, source_count: sources.length },
      }, client);
      return note;
    });
  }

  async edit(noteId: string, user: MemberSessionUser | null, content: unknown): Promise<void> {
    if (!user) throw new HertzForbiddenError('Login member diperlukan');
    const note = await this.notes.findById(noteId);
    if (!note) throw new HertzNotFoundError('Catatan komunitas tidak ditemukan');
    const createdAt = note.created_at instanceof Date ? note.created_at : new Date(note.created_at);
    const ratingCount = note.helpful_count + note.not_helpful_count;
    if (user.role !== 'admin' && (note.author_id !== user.id || ratingCount > 0 || Date.now() - createdAt.getTime() > NOTE_EDIT_WINDOW_MS)) {
      throw new HertzForbiddenError();
    }
    await this.notes.updateContent(noteId, cleanNoteContent(content));
  }

  async delete(noteId: string, user: MemberSessionUser | null): Promise<void> {
    if (!user) throw new HertzForbiddenError('Login member diperlukan');
    const note = await this.notes.findById(noteId);
    if (!note) throw new HertzNotFoundError('Catatan komunitas tidak ditemukan');
    if (note.author_id !== user.id && user.role !== 'admin') throw new HertzForbiddenError();
    await this.notes.softDelete(noteId);
  }

  async hide(noteId: string, admin: MemberSessionUser): Promise<void> {
    if (admin.role !== 'admin') throw new HertzForbiddenError();
    await this.notes.hide(noteId);
  }

  async rate(noteId: string, user: MemberSessionUser | null, rating: unknown): Promise<void> {
    if (!user) throw new HertzForbiddenError('Login member diperlukan');
    if (rating !== 'helpful' && rating !== 'not_helpful') throw new HertzValidationError('Rating tidak valid');
    await this.notes.setRating(noteId, user.id, rating as CommunityNoteRatingValue);
  }
}
