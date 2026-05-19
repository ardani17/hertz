export interface Conversation {
  id: string;
  archivedAt?: string | null;
  lastReadAt?: string | null;
  lastMessageAt?: string | null;
  unreadCount: number;
  lastMessageBody: string | null;
  peer: {
    id: string;
    displayName: string;
    username: string | null;
    avatarUrl?: string | null;
    role?: string | null;
  } | null;
}

export interface Message {
  id: string;
  senderId: string;
  body: string | null;
  createdAt: string;
  sender: { id?: string; displayName: string; username?: string | null; avatarUrl?: string | null };
  attachments: Array<{ id: string; url: string; mimeType: string }>;
  canDelete?: boolean;
}

export interface MemberResult {
  id: string;
  display_name: string | null;
  username: string | null;
}

export interface PendingAttachment {
  fileUrl: string;
  fileKey: string | null;
  mimeType: string;
  fileSize: number;
  name: string;
}

export type DmFilter = 'inbox' | 'unread' | 'admin' | 'archived';
