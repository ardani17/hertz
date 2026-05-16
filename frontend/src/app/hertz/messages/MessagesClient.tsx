'use client';

import { useCallback, useEffect, useState } from 'react';
import { HertzAppShell } from '@/components/hertz/HertzAppShell';
import { HertzTelegramLogin } from '@/components/feed/HertzTelegramLogin';
import { MoreIcon } from '@/components/feed/HertzIcons';
import type { MemberSessionUser } from '@shared/types';
import styles from './page.module.css';

interface Conversation {
  id: string;
  unreadCount: number;
  lastMessageBody: string | null;
  peer: { id: string; displayName: string; username: string | null; role?: string | null } | null;
}

interface Message {
  id: string;
  body: string | null;
  sender: { displayName: string };
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
        {status ? <p>{status}</p> : null}
        <div className={styles.filters}>
          {(['inbox', 'unread', 'admin', 'archived'] as const).map((item) => (
            <button className={filter === item ? styles.activeFilter : ''} type="button" key={item} onClick={() => setFilter(item)}>
              {item}
            </button>
          ))}
        </div>
        <input className={styles.search} value={query} onChange={(event) => void searchMembers(event.target.value)} placeholder="Cari member..." />
        {members.length ? (
          <div className={styles.list}>
            {members.map((member) => (
              <button className={styles.item} type="button" key={member.id} onClick={() => void startConversation(member.id)}>
                {member.display_name ?? member.username ?? 'Member Horizon'}
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
              <strong>{item.peer?.displayName ?? `Conversation ${item.id.slice(0, 8)}`}</strong>
              <span>{item.lastMessageBody ?? 'Belum ada pesan'}</span>
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
          {messages.map((item) => (
            <div className={styles.bubble} key={item.id}>
              <strong>{item.sender.displayName}</strong>
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
          ))}
        </div>
        {attachments.length ? (
          <div className={styles.pendingAttachments}>
            {attachments.map((attachment) => (
              <button
                type="button"
                key={attachment.fileUrl}
                onClick={() => setAttachments((items) => items.filter((item) => item.fileUrl !== attachment.fileUrl))}
              >
                {attachment.name}
              </button>
            ))}
          </div>
        ) : null}
        <div className={styles.composer}>
          <label className={styles.attachButton}>
            Gambar
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
          <input value={body} onChange={(event) => setBody(event.target.value)} placeholder="Tulis pesan..." />
          <button type="button" onClick={send} disabled={!activeId || uploading}>Kirim</button>
        </div>
      </section>
      </div>
      )}
    </HertzAppShell>
  );
}
