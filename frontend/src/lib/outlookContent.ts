export type OutlookContentKind = 'video' | 'article' | 'chart';

export interface OutlookMetadataInput {
  contentType?: string | null;
  videoUrl?: string | null;
  summary?: string | null;
  bias?: string | null;
  timeframe?: string | null;
  market?: string | null;
  sentiment?: string | null;
  risk?: string | null;
  keyPoints?: string[] | string | null;
}

export interface OutlookMediaInput {
  id: string;
  file_url: string;
  media_type: string;
}

export interface OutlookSnapshotItem {
  label: string;
  value: string;
}

function cleanString(value: unknown): string | null {
  return typeof value === 'string' ? value.trim() || null : null;
}

function normalizeKeyPoints(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  }

  return [];
}

export function stripOutlookHtml(html: string | null | undefined): string {
  return String(html ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

export function normalizeOutlookMetadata(value: unknown): OutlookMetadataInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  const input = value as Record<string, unknown>;
  const contentType = cleanString(input.contentType);

  return {
    contentType: contentType === 'video' || contentType === 'article' || contentType === 'chart'
      ? contentType
      : null,
    videoUrl: cleanString(input.videoUrl),
    summary: cleanString(input.summary),
    bias: cleanString(input.bias),
    timeframe: cleanString(input.timeframe),
    market: cleanString(input.market),
    sentiment: cleanString(input.sentiment),
    risk: cleanString(input.risk),
    keyPoints: normalizeKeyPoints(input.keyPoints),
  };
}

export function inferOutlookContentKind(input: {
  metadata: OutlookMetadataInput;
  media: OutlookMediaInput[];
  contentHtml: string;
}): OutlookContentKind {
  if (input.metadata.contentType === 'video') return 'video';
  if (input.metadata.contentType === 'chart') return 'chart';
  if (input.metadata.contentType === 'article') return 'article';
  if (input.metadata.videoUrl) return 'video';
  if (input.media.some((item) => item.media_type === 'video')) return 'video';

  const hasImage = input.media.some((item) => item.media_type === 'image');
  const plainText = stripOutlookHtml(input.contentHtml);
  if (hasImage && plainText.length <= 280) return 'chart';

  return 'article';
}

export function buildOutlookSnapshot(metadata: OutlookMetadataInput): OutlookSnapshotItem[] {
  return [
    ['Bias', metadata.bias],
    ['Timeframe', metadata.timeframe],
    ['Market', metadata.market],
    ['Sentiment', metadata.sentiment],
    ['Risk', metadata.risk],
  ]
    .filter((item): item is [string, string] => typeof item[1] === 'string' && item[1].trim().length > 0)
    .map(([label, value]) => ({ label, value: value.trim() }));
}

export function getOutlookSummary(input: {
  metadata: OutlookMetadataInput;
  contentHtml: string;
  maxLength?: number;
}): string {
  const maxLength = input.maxLength ?? 180;
  const preferred = input.metadata.summary?.trim() || stripOutlookHtml(input.contentHtml);
  if (preferred.length <= maxLength) return preferred;
  return `${preferred.slice(0, maxLength).trimEnd()}...`;
}
