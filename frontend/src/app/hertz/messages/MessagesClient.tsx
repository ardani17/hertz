'use client';

import { useCallback, useEffect, useState } from 'react';
import { ImagePlus, SendHorizontal } from 'lucide-react';
import { HertzAppShell } from '@/components/hertz/HertzAppShell';
import { HertzTelegramLogin } from '@/components/feed/HertzTelegramLogin';
import { MoreIcon } from '@/components/feed/HertzIcons';
import type { MemberSessionUser } from '@shared/types';
import styles from './page.module.css';

interface Conversation {
  id: string;
  archivedAt?: string | null;
  lastReadAt?: string | null;
  lastMessageAt?: string | null;
  unreadCount: number;
  lastMessageBody: string | null;
  peer: { id: string; displayName: string; username: string | null; avatarUrl?: string | null; role?: string | null } | null;
}

interface Message {
  id: string;
  senderId: string;
  body: string | null;
  createdAt: string;
  sender: { id?: string; displayName: string; username?: string | null; avatarUrl?: string | null };
  attachments: Array<{ id: string; url: string; mimeType: string }>;
  canDelete?: boolean;
}

interface MemberResult {
  id: string;
  display_name: string | null;
  username: string | null;
}

interface PendingAttachment {
  fileUrl: string;
  fileKey: string | null;
  mimeType: string;
  fileSize: number;
  name: string;
}

export const HERTZ_DM_POLL_INTERVAL_MS = 7000;

const filterLabels = {
  inbox: 'All',
  unread: 'Unread',
  admin: 'Admin',
  archived: 'Archived',
} as const;

export type DmMessageSide = 'incoming' | 'outgoing';

export function getDmAccessState(user: Pick<MemberSessionUser, 'id'> | null) {
  if (!user) {
    return {
      mode: 'guest' as const,
      title: 'Login Telegram untuk Direct Message',
      body: 'DM hanya tersedia untuk member HERTZ yang sudah login.',
    };
  }

  return {
    mode: 'member' as const,
    title: 'Direct Message',
    body: 'Percakapan privat antar member HERTZ.',
  };
}

export function canAddDmImages(currentCount: number, incomingCount: number) {
  return currentCount < 4 && currentCount + incomingCount <= 4;
}

export function getDmInitial(displayName: string | null | undefined, username: string | null | undefined) {
  return (displayName?.trim().charAt(0) || username?.trim().charAt(0) || 'H').toUpperCase();
}

export function getDmMessageSide(senderId: string, currentUserId: string | null | undefined): DmMessageSide {
  return senderId === currentUserId ? 'outgoing' : 'incoming';
}

export function getDmPreviewText(body: string | null | undefined, maxLength = 70): string {
  const text = body?.trim() || 'Gambar';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}...`;
}

export function formatDmTimestamp(value: string | null | undefined): string {
  if (!value) return '';
  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getDmThreadMenuActions({ active, archived }: { active: boolean; archived: boolean }) {
  if (!active) return [];
  return [archived ? 'Buka arsip' : 'Arsipkan', 'Blokir'];
}

export function HertzMessagesClient() {
  const [currentUser, setCurrentUser] = useState<MemberSessionUser | null>(null);
  const [authState, setAuthState] = useState<'loading' | 'guest' | 'member'>('loading');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [members, setMembers] = useState<MemberResult[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'inbox' | 'unread' | 'admin' | 'archived'>('inbox');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
  const [threadMenuOpen, setThreadMenuOpen] = useState(false);

  const activeConversation = conversations.find((item) => item.id === activeId) ?? null;
  const accessState = getDmAccessState(currentUser);
  const threadActions = getDmThreadMenuActions({ active: Boolean(activeId), archived: filter === 'archived' });

  const loadCurrentUser = useCallback(async () => {
    const response = await fetch('/api/auth/me', { cache: 'no-store' });
    const payload = await response.json().catch(() => null);
    const user = response.ok && payload?.success ? payload.data.user ?? null : null;
    setCurrentUser(user);
    setAuthState(user ? 'member' : 'guest');
  }, []);

  const loadInbox = useCallback(async () => {
    const response = await fetch(`/api/hertz/messages/inbox${filter === 'archived' ? '?archived=1' : ''}`, { cache: 'no-store' });
    const payload = await response.json().catch(() => null);
    if (response.ok && payload?.success) {
      setConversations(payload.data.conversations);
      setActiveId((current) => current ?? payload.data.conversations[0]?.id ?? null);
    }
    else setStatus(payload?.error?.message ?? 'Login member diperlukan.');
  }, [filter]);

  const loadThread = useCallback(async (id: string) => {
    const response = await fetch(`/api/hertz/messages/conversations/${id}`, { cache: 'no-store' });
    const payload = await response.json().catch(() => null);
    if (response.ok && payload?.success) setMessages(payload.data.messages);
  }, []);

  async function searchMembers(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setMembers([]);
      return;
    }
    const response = await fetch(`/api/hertz/messages/conversations?q=${encodeURIComponent(value)}`, { cache: 'no-store' });
    const payload = await response.json().catch(() => null);
    if (response.ok && payload?.success) setMembers(payload.data.members);
  }

  async function startConversation(recipientId: string) {
    const response = await fetch('/api/hertz/messages/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientId }),
    });
    const payload = await response.json().catch(() => null);
    if (response.ok && payload?.success) {
      setActiveId(payload.data.conversation.id);
      setMobileThreadOpen(true);
      setMembers([]);
      setQuery('');
      await loadInbox();
    }
  }

  async function send() {
    if (!activeId || (!body.trim() && attachments.length === 0)) return;
    const response = await fetch(`/api/hertz/messages/conversations/${activeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body, attachments }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      setStatus(payload?.error?.message ?? 'Pesan gagal dikirim.');
      return;
    }
    setBody('');
    setAttachments([]);
    await loadThread(activeId);
    await loadInbox();
  }

  async function archiveConversation(archived: boolean) {
    if (!activeId) return;
    const response = await fetch(`/api/hertz/messages/conversations/${activeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      setStatus(payload?.error?.message ?? 'Conversation gagal diperbarui.');
      return;
    }
    setActiveId(null);
    setMessages([]);
    await loadInbox();
  }

  async function blockPeer() {
    const peerId = activeConversation?.peer?.id;
    if (!peerId) return;
    const response = await fetch(`/api/hertz/messages/blocks/${peerId}`, { method: 'POST' });
    const payload = await response.json().catch(() => null);
    setStatus(response.ok && payload?.success ? 'Member diblokir dari DM.' : payload?.error?.message ?? 'Block gagal.');
  }

  async function deleteMessage(messageId: string) {
    const response = await fetch(`/api/hertz/messages/messages/${messageId}`, { method: 'DELETE' });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      setStatus(payload?.error?.message ?? 'Pesan gagal dihapus.');
      return;
    }
    if (activeId) await loadThread(activeId);
  }

  async function reportMessage(messageId: string) {
    const details = window.prompt('Detail report opsional') ?? '';
    const response = await fetch(`/api/hertz/messages/messages/${messageId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'reported_from_dm', details }),
    });
    const payload = await response.json().catch(() => null);
    setStatus(response.ok && payload?.success ? 'Report DM masuk ke review admin.' : payload?.error?.message ?? 'Report gagal.');
  }

  async function uploadImages(files: FileList | null) {
    if (!files?.length) return;
    if (!canAddDmImages(attachments.length, files.length)) {
      setStatus('Maksimal 4 gambar per pesan.');
      return;
    }
    const nextFiles = Array.from(files).slice(0, Math.max(0, 4 - attachments.length));
    if (nextFiles.length === 0) {
      setStatus('Maksimal 4 gambar per pesan.');
      return;
    }
    setUploading(true);
    setStatus(null);
    try {
      const uploaded: PendingAttachment[] = [];
      for (const file of nextFiles) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          throw new Error('DM hanya mendukung JPG, PNG, atau WEBP.');
        }
        if (file.size > 5 * 1024 * 1024) {
          throw new Error('Ukuran gambar DM maksimal 5MB.');
        }
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch('/api/media/upload', { method: 'POST', body: formData });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.success || !payload.data?.media) {
          throw new Error(payload?.error?.message ?? 'Gagal mengunggah gambar DM.');
        }
        uploaded.push({
          fileUrl: payload.data.media.file_url,
          fileKey: payload.data.media.file_key ?? null,
          mimeType: file.type,
          fileSize: file.size,
          name: file.name,
        });
      }
      setAttachments((items) => [...items, ...uploaded].slice(0, 4));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Gagal mengunggah gambar DM.');
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => {
    void loadCurrentUser();
  }, [loadCurrentUser]);

  useEffect(() => {
    if (authState !== 'member') return;
    void loadInbox();
  }, [authState, loadInbox]);

  useEffect(() => {
    if (!activeId) return undefined;
    void loadThread(activeId);
    const timer = window.setInterval(() => void loadThread(activeId), HERTZ_DM_POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [activeId, loadThread]);

  return (
    <HertzAppShell
      active="messages"
      title="Direct Message"
      description="Percakapan privat antar member HERTZ."
      currentUser={currentUser}
      hideRightRail
    >
      {authState !== 'member' ? (
        <section className={styles.guestPanel}>
          <span>{authState === 'loading' ? 'Memuat session' : 'Mode guest'}</span>
          <h2>{accessState.title}</h2>
          <p>{accessState.body}</p>
          {authState === 'guest' ? <HertzTelegramLogin /> : null}
        </section>
      ) : (
      <div className={`${styles.dmLayout} ${mobileThreadOpen ? styles.threadOpen : ''}`}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div>
            <h2>Messages</h2>
            <span>{conversations.length} conversations</span>
          </div>
        </div>
        {status ? <p className={styles.status}>{status}</p> : null}
        <div className={styles.filters}>
          {(['inbox', 'unread', 'admin', 'archived'] as const).map((item) => (
            <button className={filter === item ? styles.activeFilter : ''} type="button" key={item} onClick={() => setFilter(item)}>
              {filterLabels[item]}
            </button>
          ))}
        </div>
        <input className={styles.search} value={query} onChange={(event) => void searchMembers(event.target.value)} placeholder="Search Direct Messages" />
        {members.length ? (
          <div className={styles.searchResults}>
            {members.map((member) => (
              <button className={styles.item} type="button" key={member.id} onClick={() => void startConversation(member.id)}>
                <span className={styles.itemAvatar} aria-hidden="true">
                  {getDmInitial(member.display_name, member.username)}
                </span>
                <span className={styles.itemMain}>
                  <span className={styles.itemTop}>
                    <strong>{member.display_name ?? member.username ?? 'Member Horizon'}</strong>
                  </span>
                  <span className={styles.itemMeta}>{member.username ? `@${member.username}` : 'HERTZ member'}</span>
                </span>
              </button>
            ))}
          </div>
        ) : null}
        <div className={styles.list}>
          {conversations.filter((item) => {
            if (filter === 'unread') return item.unreadCount > 0;
            if (filter === 'admin') return item.peer?.role === 'admin';
            return true;
          }).map((item) => (
            <button
              className={styles.item}
              type="button"
              key={item.id}
              onClick={() => {
                setActiveId(item.id);
                setMobileThreadOpen(true);
              }}
            >
              <span className={styles.itemAvatar} aria-hidden="true">
                {getDmInitial(item.peer?.displayName, item.peer?.username)}
              </span>
              <span className={styles.itemMain}>
                <span className={styles.itemTop}>
                  <strong>{item.peer?.displayName ?? `Conversation ${item.id.slice(0, 8)}`}</strong>
                  <time>{formatDmTimestamp(item.lastMessageAt)}</time>
                </span>
                <span className={styles.itemMeta}>
                  {item.peer?.username ? `@${item.peer.username}` : 'HERTZ member'}
                </span>
                <span className={styles.itemPreview}>{getDmPreviewText(item.lastMessageBody)}</span>
              </span>
              {item.unreadCount > 0 ? <em>{item.unreadCount}</em> : null}
            </button>
          ))}
        </div>
      </aside>
      <section className={styles.thread}>
        <div className={styles.threadHeader}>
          <button type="button" className={styles.backButton} onClick={() => setMobileThreadOpen(false)}>
            Inbox
          </button>
          <div className={styles.threadPeerAvatar} aria-hidden="true">
            {getDmInitial(activeConversation?.peer?.displayName, activeConversation?.peer?.username)}
          </div>
          <div>
            <strong>{activeConversation?.peer?.displayName ?? 'Pilih conversation'}</strong>
            <span>{activeConversation?.peer?.username ? `@${activeConversation.peer.username}` : 'HERTZ DM'}</span>
          </div>
          <div className={styles.threadMenu}>
            <button
              type="button"
              className={styles.menuTrigger}
              onClick={() => setThreadMenuOpen((value) => !value)}
              disabled={!activeId}
              aria-label="Menu percakapan"
              aria-expanded={threadMenuOpen}
            >
              <MoreIcon />
            </button>
            {threadMenuOpen ? (
              <div className={styles.threadActions}>
                {threadActions.includes('Arsipkan') ? (
                  <button type="button" onClick={() => { setThreadMenuOpen(false); void archiveConversation(true); }}>
                    Arsipkan
                  </button>
                ) : null}
                {threadActions.includes('Buka arsip') ? (
                  <button type="button" onClick={() => { setThreadMenuOpen(false); void archiveConversation(false); }}>
                    Buka arsip
                  </button>
                ) : null}
                <button type="button" onClick={() => { setThreadMenuOpen(false); void blockPeer(); }} disabled={!activeConversation?.peer?.id}>
                  Blokir
                </button>
              </div>
            ) : null}
          </div>
        </div>
        <div className={styles.messages}>
          {!activeId ? (
            <div className={styles.emptyThread}>
              <h2>Select a message</h2>
              <p>Pilih conversation atau cari member untuk mulai Direct Message.</p>
            </div>
          ) : messages.length === 0 ? (
            <div className={styles.emptyThread}>
              <h2>Belum ada pesan</h2>
              <p>Kirim pesan pertama ke conversation ini.</p>
            </div>
          ) : (
            messages.map((item) => {
              const side = getDmMessageSide(item.senderId, currentUser?.id);
              return (
                <div className={`${styles.bubbleRow} ${side === 'outgoing' ? styles.outgoing : styles.incoming}`} key={item.id}>
                  {side === 'incoming' ? (
                    <span className={styles.messageAvatar} aria-hidden="true">
                      {getDmInitial(item.sender.displayName, item.sender.username)}
                    </span>
                  ) : null}
                  <div className={styles.bubble}>
                    <div className={styles.bubbleMeta}>
                      <strong>{side === 'outgoing' ? 'Anda' : item.sender.displayName}</strong>
                      <time>{formatDmTimestamp(item.createdAt)}</time>
                    </div>
                    <span>{item.body ?? 'Pesan dihapus'}</span>
                    {item.attachments.length ? (
                      <div className={styles.attachments}>
                        {item.attachments.map((attachment) => (
                          <img key={attachment.id} src={attachment.url} alt="DM attachment" />
                        ))}
                      </div>
                    ) : null}
                    <div className={styles.messageActions}>
                      {item.canDelete ? <button type="button" onClick={() => deleteMessage(item.id)}>Delete</button> : null}
                      <button type="button" onClick={() => reportMessage(item.id)}>Report</button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {attachments.length ? (
          <div className={styles.pendingAttachments}>
            {attachments.map((attachment) => (
              <button
                type="button"
                key={attachment.fileUrl}
                onClick={() => setAttachments((items) => items.filter((item) => item.fileUrl !== attachment.fileUrl))}
                aria-label={`Hapus attachment ${attachment.name}`}
              >
                <img src={attachment.fileUrl} alt="" />
                <span>{attachment.name}</span>
              </button>
            ))}
          </div>
        ) : null}
        <div className={styles.composer}>
          <label className={styles.attachButton}>
            <ImagePlus aria-hidden="true" />
            <span>Gambar</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={!activeId || uploading || attachments.length >= 4}
              onChange={(event) => {
                void uploadImages(event.target.files);
                event.currentTarget.value = '';
              }}
            />
          </label>
          <input value={body} onChange={(event) => setBody(event.target.value)} placeholder={activeId ? 'Start a new message' : 'Pilih conversation dulu'} />
          <button type="button" onClick={send} disabled={!activeId || uploading} aria-label="Kirim pesan">
            <SendHorizontal aria-hidden="true" />
            <span>Kirim</span>
          </button>
        </div>
      </section>
      </div>
      )}
    </HertzAppShell>
  );
}
