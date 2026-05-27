import type { HertzComment, HertzFeedResult, HertzPost, HertzPostDetail } from './feed';
import type { HertzProfileActivity } from '../services/hertzProfileService';
import type { MemberPublicProfileDto, MemberPublicProfileInput } from './memberProfile';
import type { MemberSessionUser, TelegramAuthData } from './membership';

export type MobilePlatform = 'ios' | 'android';
export type MobilePushPlatform = MobilePlatform | 'expo';

export interface MobileSessionInfo {
  id: string;
  deviceId: string | null;
  platform: MobilePlatform | null;
  appVersion: string | null;
  expiresAt: string;
  createdAt: string;
  lastUsedAt: string | null;
  current?: boolean;
}

export interface MobileNotificationSummary {
  unreadCount: number;
  hasUnread: boolean;
  unreadDmCount: number;
  hasUnreadDm: boolean;
}

export interface MobileAuthResponse {
  token: string;
  expiresAt: string;
  user: MemberSessionUser;
  session?: MobileSessionInfo;
  loginMechanism: 'telegram_external_browser_callback';
}

export interface MobileHandoffInitInput {
  deviceId: string;
  platform: MobilePlatform;
  appVersion?: string | null;
}

export interface MobileHandoffInitResponse {
  nonce: string;
  expiresAt: string;
  handoffUrl: string;
}

export interface MobileHandoffExchangeInput {
  nonce: string;
  telegramAuth: TelegramAuthData;
}

export interface MobileMeResponse {
  user: MemberSessionUser;
  notifications: MobileNotificationSummary;
  session: MobileSessionInfo;
}

export interface MobileSessionListResponse {
  sessions: MobileSessionInfo[];
}

export interface MobileRefreshInput {
  deviceId: string;
}

export type MobileHertzPost = HertzPost;
export type MobileHertzPostDetail = HertzPostDetail;
export type MobileHertzFeedResult = HertzFeedResult;
export type MobileHertzComment = HertzComment;

export interface MobileDmParticipant {
  userId: string;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
  role: 'member' | 'admin' | null;
}

export interface MobileDmInboxItem {
  conversationId: string;
  lastMessage: {
    body: string | null;
    sentAt: string | null;
    fromMe: boolean;
  };
  unreadCount: number;
  participant: MobileDmParticipant | null;
  archivedAt: string | null;
  lastReadAt: string | null;
}

export interface MobileDmInboxResponse {
  items: MobileDmInboxItem[];
  nextCursor: string | null;
}

export interface MobileDmAttachment {
  id: string;
  fileUrl: string;
  thumbnailUrl: string;
  mimeType: string;
  sizeBytes: number;
}

export interface MobileDmMessage {
  id: string;
  conversationId: string;
  fromUserId: string;
  body: string | null;
  deletedAt: string | null;
  sentAt: string;
  sender: MobileDmParticipant;
  attachments: MobileDmAttachment[];
  canDelete: boolean;
}

export interface MobileDmThreadResponse {
  isPartial: boolean;
  messages: MobileDmMessage[];
  hasMoreBefore?: boolean;
}

export interface MobileDmTypingResponse {
  typingUserIds: string[];
  lastUpdated: string | null;
}

export interface MobileDmBlockResponse {
  blocked: boolean;
}

export interface MobileDmReportInput {
  reason: string;
  details?: string | null;
}

export interface MobileNotificationActor {
  userId: string;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
}

export interface MobileNotificationItem {
  id: string;
  type: string;
  targetType: string;
  targetId: string;
  href: string;
  readAt: string | null;
  createdAt: string;
  actor: MobileNotificationActor | null;
  post: { id: string; shortId: string | null; preview: string | null } | null;
  metadata: Record<string, unknown>;
}

export interface MobileNotificationListResponse {
  items: MobileNotificationItem[];
  nextCursor: string | null;
  summary: MobileNotificationSummary;
}

export interface MobileNotificationReadInput {
  ids?: string[];
  all?: boolean;
}

export interface MobileMediaUploadResponse {
  media: {
    id: string;
    fileUrl: string;
    thumbnailUrl: string;
    mediaType: 'image' | 'video';
    fileKey: string | null;
    sizeBytes: number | null;
    createdAt: string;
  } | null;
}

export interface MobilePushRegisterInput {
  platform: MobilePushPlatform;
  token: string;
  deviceId?: string | null;
  appVersion?: string | null;
}

export interface MobileBookmarkResponse {
  active: boolean;
  bookmarked: boolean;
}

export interface MobileRepostInput {
  type: 'repost' | 'quote';
  content?: string | null;
  mediaIds?: string[];
}

export interface MobileRepostResponse {
  active?: boolean;
  repostId?: string | null;
  repostPostId?: string | null;
  post?: MobileHertzPost;
}

export interface MobileViewResponse {
  recorded: boolean;
}

export interface MobileReportInput {
  reason: string;
  details?: string | null;
}

export type MobileSearchType = 'post' | 'member';

export interface MobileSearchResultItem {
  type: 'post' | 'member' | 'topic' | 'pair';
  id: string;
  label: string;
  description: string | null;
  href: string;
}

export interface MobileSearchResponse {
  query: string;
  results: MobileSearchResultItem[];
  nextCursor: string | null;
}

export interface MobileMarketRailGroup {
  label: string;
  items: Array<Record<string, unknown>>;
}

export interface MobileMarketRailResponse {
  groups: MobileMarketRailGroup[];
  cacheTtlSeconds: number;
}

export interface MobileProfileActivityResponse {
  activity: HertzProfileActivity;
}

export interface MobileProfileMeResponse {
  profile: MemberPublicProfileDto;
}

export interface MobileProfileUpdateInput extends MemberPublicProfileInput {
  displayName?: string | null;
  avatarMediaId?: string | null;
  coverMediaId?: string | null;
}

