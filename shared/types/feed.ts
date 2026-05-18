import type { CommunityNote } from './communityNote';

export type HertzPostType = 'original' | 'quote' | 'repost';
export type HertzPostSource = 'telegram' | 'web' | 'admin' | 'system';
export type HertzPostCategory = 'trading_room' | 'life_coffee' | 'general' | 'community_note' | 'trading' | 'life_story';
export type HertzPostStatus = 'draft' | 'pending_review' | 'published' | 'hidden' | 'rejected' | 'deleted';

export interface HertzAuthor {
  id: string;
  name: string;
  username: string | null;
  badge: 'verified_member' | 'admin';
  avatarUrl: string | null;
}

export interface HertzMedia {
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

export interface HertzViewerState {
  hasPulsed: boolean;
  hasBookmarked: boolean;
  hasReposted: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface HertzPostCounts {
  comments: number;
  pulses: number;
  reposts: number;
  views: number;
}

export interface HertzPostContent {
  html: string;
  text: string;
  isTruncated: boolean;
}

export interface HertzPost {
  id: string;
  shortId: string;
  articleId: string | null;
  type: HertzPostType;
  source: HertzPostSource;
  category: HertzPostCategory;
  status: HertzPostStatus;
  author: HertzAuthor;
  content: HertzPostContent;
  media: HertzMedia[];
  market: MarketContext | null;
  quotedPost: HertzPost | null;
  viewer: HertzViewerState;
  counts: HertzPostCounts;
  primaryCommunityNote?: CommunityNote | null;
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
}

export interface HertzPostDetail extends HertzPost {
  comments: HertzComment[];
  communityNotes?: CommunityNote[];
}

export interface HertzComment {
  id: string;
  postId: string;
  userId: string;
  parentCommentId: string | null;
  replies: HertzComment[];
  author: HertzAuthor;
  content: string;
  status: 'visible' | 'hidden' | 'deleted';
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
  canEdit: boolean;
  canDelete: boolean;
}

export interface HertzPostInput {
  category: HertzPostCategory;
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
  items: HertzPost[];
  nextCursor: string | null;
}

export type SignalPostType = HertzPostType;
export type SignalPostSource = HertzPostSource;
export type SignalPostCategory = HertzPostCategory;
export type SignalPostStatus = HertzPostStatus;
export type SignalAuthor = HertzAuthor;
export type SignalMedia = HertzMedia;
export type SignalViewerState = HertzViewerState;
export type SignalPostCounts = HertzPostCounts;
export type SignalPostContent = HertzPostContent;
export type SignalPost = HertzPost;
export type SignalPostDetail = HertzPostDetail;
export type SignalComment = HertzComment;
export type SignalPostInput = HertzPostInput;
export type HertzFeedResult = CursorFeedResult;
