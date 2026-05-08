import type { CommunityNote } from './communityNote';

export type SignalPostType = 'original' | 'quote' | 'repost';
export type SignalPostSource = 'telegram' | 'web' | 'admin' | 'system';
export type SignalPostCategory = 'trading' | 'life_story' | 'general';
export type SignalPostStatus = 'draft' | 'pending_review' | 'published' | 'hidden' | 'rejected' | 'deleted';

export interface SignalAuthor {
  id: string;
  name: string;
  username: string | null;
  badge: 'verified_member' | 'admin';
  avatarUrl: string | null;
}

export interface SignalMedia {
  id: string;
  url: string;
  type: 'image' | 'video';
  alt: string | null;
}

export interface MarketContext {
  pair?: string | null;
  timeframe?: string | null;
  riskPercent?: number | null;
  direction?: string | null;
  entryPrice?: number | null;
  entryZone?: string | null;
  stopLoss?: number | null;
  takeProfit?: number | null;
  takeProfit1?: number | null;
  takeProfit2?: number | null;
  takeProfit3?: number | null;
  setupType?: string | null;
  confidencePercent?: number | null;
  brokerOrSource?: string | null;
}

export interface SignalViewerState {
  hasSignaled: boolean;
  hasBookmarked: boolean;
  hasReposted: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface SignalPostCounts {
  comments: number;
  signals: number;
  reposts: number;
  views: number;
}

export interface SignalPostContent {
  html: string;
  text: string;
  isTruncated: boolean;
}

export interface SignalPost {
  id: string;
  articleId: string | null;
  type: SignalPostType;
  source: SignalPostSource;
  category: SignalPostCategory;
  status: SignalPostStatus;
  author: SignalAuthor;
  content: SignalPostContent;
  media: SignalMedia[];
  market: MarketContext | null;
  quotedPost: SignalPost | null;
  viewer: SignalViewerState;
  counts: SignalPostCounts;
  primaryCommunityNote: CommunityNote | null;
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
}

export interface SignalPostDetail extends SignalPost {
  comments: SignalComment[];
  communityNotes: CommunityNote[];
}

export interface SignalComment {
  id: string;
  postId: string;
  userId: string;
  author: SignalAuthor;
  content: string;
  status: 'visible' | 'hidden' | 'deleted';
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
  canEdit: boolean;
  canDelete: boolean;
}

export interface SignalPostInput {
  category: SignalPostCategory;
  content: string;
  mediaIds?: string[];
  market?: MarketContext | null;
}

export interface QuoteRepostInput {
  type: 'quote';
  content: string;
  mediaIds?: string[];
}

export interface PlainRepostInput {
  type: 'repost';
}

export type RepostInput = PlainRepostInput | QuoteRepostInput;

export interface CursorFeedResult {
  items: SignalPost[];
  nextCursor: string | null;
}
