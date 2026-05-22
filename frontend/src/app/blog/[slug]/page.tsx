import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BlogArticleService } from '@shared/services/blogArticleService';
import { ArticleMeta } from '@/components/article/ArticleMeta';
import { ArticleContent } from '@/components/article/ArticleContent';
import { OutlookEngagement } from '@/components/outlook';
import { getCurrentMember } from '@/lib/memberAuth';
import styles from './page.module.css';

export const revalidate = 300;

async function loadBlog(slug: string) {
  try {
    return await new BlogArticleService().getPublishedBySlug(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await loadBlog(slug);

  if (!article) {
    return { title: 'Blog Tidak Ditemukan' };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const blogUrl = `${baseUrl}/blog/${article.slug}`;

  const plainText = article.content_html.replace(/<[^>]*>/g, '').trim();
  const description =
    plainText.length > 160 ? plainText.slice(0, 160).trimEnd() + '…' : plainText;

  const title = article.title || 'Blog';
  const firstImage = article.media.find((m) => m.media_type === 'image');
  const ogImage = firstImage?.file_url || `${baseUrl}/images/og-default.svg`;

  return {
    title,
    description,
    alternates: { canonical: blogUrl },
    openGraph: { title, description, url: blogUrl, type: 'article', images: [{ url: ogImage }] },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
  };
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [article, currentUser] = await Promise.all([loadBlog(slug), getCurrentMember()]);

  if (!article) {
    notFound();
  }

  const displayTitle =
    article.title || article.content_html.replace(/<[^>]*>/g, '').trim().slice(0, 80);

  const plainText = article.content_html.replace(/<[^>]*>/g, '').trim();
  const excerpt = plainText.length > 120 ? plainText.slice(0, 120).trimEnd() + '…' : plainText;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const blogUrl = `${baseUrl}/blog/${article.slug}`;
  const coverImage = article.media.find((m) => m.media_type === 'image');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: displayTitle,
    description: excerpt,
    image: coverImage?.file_url || `${baseUrl}/images/og-default.svg`,
    datePublished: article.created_at,
    author: { '@type': 'Person', name: article.author_name || 'Anonim' },
    publisher: { '@type': 'Organization', name: 'Horizon' },
    url: blogUrl,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <div className={styles.content}>
        <Link href="/blog" className={styles.backLink}>
          ← Kembali ke Blog
        </Link>

        <article className={styles.article}>
          <h1 className={styles.title}>{displayTitle}</h1>

          <ArticleMeta
            authorName={article.author_name}
            createdAt={article.created_at}
            contentHtml={article.content_html}
            category={article.category}
          />

          {coverImage ? (
            <img
              src={coverImage.file_url}
              alt={displayTitle}
              className={styles.coverImage}
              loading="lazy"
              decoding="async"
              width={960}
              height={540}
            />
          ) : null}

          <ArticleContent html={article.content_html} />
        </article>

        <OutlookEngagement
          articleId={article.id}
          title={displayTitle}
          excerpt={excerpt}
          url={blogUrl}
          initialLikeCount={article.likeCount}
          initialCommentCount={article.commentCount}
          currentUser={currentUser}
          contentLabel="Blog"
        />
      </div>
    </>
  );
}
