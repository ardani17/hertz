import type {
  HertzAuthor,
  HertzFeedResult,
  HertzPost,
  HertzPostDetail,
  HertzPostInput,
} from './feed';

export type {
  HertzAuthor,
  HertzFeedResult,
  HertzPost,
  HertzPostDetail,
  HertzPostInput,
};

export interface HertzBlogPostInput {
  title: string;
  content: string;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export interface HertzBlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  author: HertzAuthor;
  publishedAt: string;
  updatedAt: string;
}

export interface HertzConversation {
  id: string;
  participant: HertzAuthor;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  archived: boolean;
}

export interface HertzMessageAttachment {
  id: string;
  url: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  size: number;
}

export interface HertzMessage {
  id: string;
  conversationId: string;
  sender: HertzAuthor;
  body: string | null;
  attachments: HertzMessageAttachment[];
  createdAt: string;
  deletedAt: string | null;
}

export interface HertzCreditSetting {
  key: string;
  amount: number;
  isActive: boolean;
  updatedAt: string;
}
