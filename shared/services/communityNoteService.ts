import { withTransaction } from '../db';
import { ActivityLogService } from './activityLog';
import { FeedForbiddenError, FeedNotFoundError, FeedValidationError } from './feedService';
import { CommunityNoteRepository } from '../repositories/communityNoteRepository';
import { FeedRepository } from '../repositories/feedRepository';
import type { CommunityNoteInput, CommunityNoteRatingValue, CommunityNoteSourceInput } from '../types/communityNote';
import type { MemberSessionUser } from '../types/membership';

const NOTE_EDIT_WINDOW_MS = 10 * 60 * 1000;

function cleanNoteContent(content: unknown): string {
  const text = typeof content === 'string' ? content.trim() : '';
  if (!text) throw new FeedValidationError('Catatan komunitas tidak boleh kosong');
  if (text.length > 4000) throw new FeedValidationError('Catatan komunitas maksimal 4000 karakter');
  return text;
}

function validateSources(sources: unknown): CommunityNoteSourceInput[] {
  if (!Array.isArray(sources) || sources.length === 0) {
    throw new FeedValidationError('Community note wajib memiliki minimal satu source URL');
  }
  return sources.map((source) => {
    if (!source || typeof source !== 'object') {
      throw new FeedValidationError('Source tidak valid');
    }
    const record = source as Record<string, unknown>;
    const url = typeof record.url === 'string' ? record.url.trim() : '';
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('invalid protocol');
      }
    } catch {
      throw new FeedValidationError('Source URL tidak valid');
    }
    return {
      url,
      title: typeof record.title === 'string' && record.title.trim()
        ? record.title.trim().slice(0, 500)
        : null,
    };
  });
}

export class CommunityNoteService {
  private readonly repo = new CommunityNoteRepository();
  private readonly feedRepo = new FeedRepository();
  private readonly logs = new ActivityLogService();

  async create(postId: string, user: MemberSessionUser | null, input: CommunityNoteInput) {
    if (!user) throw new FeedForbiddenError('Login member diperlukan');
    const content = cleanNoteContent(input.content);
    const sources = validateSources(input.sources);
    const resolvedPostId = await this.feedRepo.resolvePostId(postId);
    if (!resolvedPostId) throw new FeedNotFoundError('Post tidak ditemukan');
    return withTransaction(async (client) => {
      const note = await this.repo.create(resolvedPostId, user.id, content, sources, client);
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
    if (!user) throw new FeedForbiddenError('Login member diperlukan');
    const note = await this.repo.findById(noteId);
    if (!note) throw new FeedNotFoundError('Catatan komunitas tidak ditemukan');
    const isOwner = note.author_id === user.id;
    const isAdmin = user.role === 'admin';
    const createdAt = note.created_at instanceof Date ? note.created_at : new Date(note.created_at);
    const ratingCount = note.helpful_count + note.not_helpful_count;
    if (!isAdmin && (!isOwner || ratingCount > 0 || Date.now() - createdAt.getTime() > NOTE_EDIT_WINDOW_MS)) {
      throw new FeedForbiddenError();
    }
    const cleaned = cleanNoteContent(content);
    await withTransaction(async (client) => {
      await this.repo.updateContent(noteId, cleaned, client);
      await this.logs.log({
        actor_id: user.id,
        actor_type: user.role === 'admin' ? 'admin' : 'member',
        action: 'hertz.community_note.edited',
        target_type: 'community_note',
        target_id: noteId,
      }, client);
    });
  }

  async delete(noteId: string, user: MemberSessionUser | null): Promise<void> {
    if (!user) throw new FeedForbiddenError('Login member diperlukan');
    const note = await this.repo.findById(noteId);
    if (!note) throw new FeedNotFoundError('Catatan komunitas tidak ditemukan');
    if (note.author_id !== user.id && user.role !== 'admin') throw new FeedForbiddenError();
    await withTransaction(async (client) => {
      await this.repo.softDelete(noteId, client);
      await this.logs.log({
        actor_id: user.id,
        actor_type: user.role === 'admin' ? 'admin' : 'member',
        action: 'hertz.community_note.deleted',
        target_type: 'community_note',
        target_id: noteId,
      }, client);
    });
  }

  async hide(noteId: string, admin: MemberSessionUser): Promise<void> {
    if (admin.role !== 'admin') throw new FeedForbiddenError();
    await withTransaction(async (client) => {
      await this.repo.hide(noteId, client);
      await this.logs.log({
        actor_id: admin.id,
        actor_type: 'admin',
        action: 'hertz.community_note.hidden',
        target_type: 'community_note',
        target_id: noteId,
      }, client);
    });
  }

  async rate(noteId: string, user: MemberSessionUser | null, rating: unknown): Promise<void> {
    if (!user) throw new FeedForbiddenError('Login member diperlukan');
    if (rating !== 'helpful' && rating !== 'not_helpful') {
      throw new FeedValidationError('Rating tidak valid');
    }
    await withTransaction(async (client) => {
      await this.repo.setRating(noteId, user.id, rating as CommunityNoteRatingValue, client);
      await this.logs.log({
        actor_id: user.id,
        actor_type: user.role === 'admin' ? 'admin' : 'member',
        action: 'hertz.community_note.rated',
        target_type: 'community_note',
        target_id: noteId,
        details: { rating },
      }, client);
    });
  }
}
