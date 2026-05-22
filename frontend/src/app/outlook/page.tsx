import type { Metadata } from 'next';
import { OutlookArticleService } from '@shared/services/outlookArticleService';
import { OutlookListClient } from '@/components/outlook/OutlookListClient';

export const metadata: Metadata = {
  title: 'Outlook',
  description: 'Analisa market mendalam dari komunitas trader Horizon.',
  alternates: { canonical: '/outlook' },
};

export const revalidate = 120;

export default async function OutlookPage() {
  let articles: Awaited<ReturnType<OutlookArticleService['listPublished']>> = [];
  try {
    articles = await new OutlookArticleService().listPublished();
  } catch {
    articles = [];
  }

  return <OutlookListClient initialArticles={articles} />;
}
