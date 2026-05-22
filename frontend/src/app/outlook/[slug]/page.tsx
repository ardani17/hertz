import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { OutlookArticleService } from '@shared/services/outlookArticleService';
import { OutlookListClient } from '@/components/outlook/OutlookListClient';
import { buildOutlookDetailModel } from '@/lib/outlookContent';

export const revalidate = 300;

async function loadOutlook(slug: string) {
  try {
    return await new OutlookArticleService().getPublishedBySlug(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await loadOutlook(slug);

  if (!article) {
    return { title: 'Outlook Tidak Ditemukan' };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const outlookUrl = `${baseUrl}/outlook/${article.slug}`;
  const detail = buildOutlookDetailModel(article);

  const description =
    detail.summary.length > 160 ? `${detail.summary.slice(0, 160).trimEnd()}…` : detail.summary;

  const title = detail.title;
  const firstImage = article.media.find((m) => m.media_type === 'image');
  const ogImage = firstImage?.file_url || `${baseUrl}/images/og-default.svg`;

  return {
    title,
    description,
    alternates: { canonical: outlookUrl },
    openGraph: {
      title,
      description,
      url: outlookUrl,
      type: 'article',
      images: [{ url: ogImage }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

/** Deep link: daftar Outlook + modal artikel (SPA), metadata OG tetap di route ini. */
export default async function OutlookDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = new OutlookArticleService();
  const [article, articles] = await Promise.all([loadOutlook(slug), service.listPublished().catch(() => [])]);

  if (!article) {
    notFound();
  }

  return <OutlookListClient initialArticles={articles} />;
}
