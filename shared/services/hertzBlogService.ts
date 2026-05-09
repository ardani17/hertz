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
}
