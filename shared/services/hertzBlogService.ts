import { withTransaction, execute } from '../db';
import { HertzBlogRepository } from '../repositories/hertzBlogRepository';
import { slugify, extractFirstWords } from '../utils/slugify';
import { textToHtml } from '../utils/textToHtml';
import type { HertzBlogPostInput } from '../types/hertz';
import type { MemberSessionUser } from '../types/membership';

export class HertzBlogService {
  private readonly repo = new HertzBlogRepository();

  async create(user: MemberSessionUser, input: HertzBlogPostInput) {
    const title = input.title.trim();
    const content = input.content.trim();
    if (!title || !content) throw new Error('Title dan content wajib diisi');

    let baseSlug = slugify(title || extractFirstWords(content, 8));
    if (!baseSlug) baseSlug = `blog-${Date.now()}`;

    return withTransaction(async (client) => {
      let slug = baseSlug;
      for (let attempt = 2; await this.repo.slugExists(slug, client); attempt++) {
        slug = `${baseSlug}-${attempt}`;
      }
      const article = await this.repo.create(user.id, slug, {
        ...input,
        title,
        content: textToHtml(content),
      }, client);
      if (!article) throw new Error('Gagal membuat blog');
      await execute(
        `INSERT INTO hertz_credit_ledger (user_id, event_type, entity_id, amount)
         VALUES ($1, 'blog_published', $2, COALESCE((
           SELECT amount FROM hertz_credit_settings WHERE key = 'blog_published' AND is_active = true
         ), 0))
         ON CONFLICT DO NOTHING`,
        [user.id, article.id],
        client,
      );
      return article;
    });
  }

  async update(user: MemberSessionUser, articleId: string, input: HertzBlogPostInput): Promise<void> {
    const article = await this.repo.findManageable(articleId);
    if (!article) throw new Error('Blog tidak ditemukan');
    if (article.author_id !== user.id && user.role !== 'admin') throw new Error('Akses ditolak');
    const title = input.title.trim();
    const content = input.content.trim();
    if (!title || !content) throw new Error('Title dan content wajib diisi');
    await this.repo.update(articleId, { ...input, title, content: textToHtml(content) });
  }

  async delete(user: MemberSessionUser, articleId: string): Promise<void> {
    const article = await this.repo.findManageable(articleId);
    if (!article) throw new Error('Blog tidak ditemukan');
    if (article.author_id !== user.id && user.role !== 'admin') throw new Error('Akses ditolak');
    await this.repo.softDelete(articleId);
  }

  async report(user: MemberSessionUser, articleId: string, reason: unknown): Promise<void> {
    const reasonText = typeof reason === 'string' && reason.trim() ? reason.trim().slice(0, 50) : 'other';
    await execute(
      `INSERT INTO hertz_reports (target_type, target_id, reporter_user_id, reason)
       VALUES ('blog', $1, $2, $3)`,
      [articleId, user.id, reasonText],
    );
  }
}
