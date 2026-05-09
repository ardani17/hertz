'use client';

import { useEffect, useState } from 'react';
import { SignalLeftRail } from '@/components/feed/SignalLeftRail';
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

export default function HertzMessagesPage() {
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

  async function loadInbox() {
    const response = await fetch(`/api/hertz/messages/inbox${filter === 'archived' ? '?archived=1' : ''}`, { cache: 'no-store' });
    const payload = await response.json().catch(() => null);
    if (response.ok && payload?.success) setConversations(payload.data.conversations);
    else setStatus(payload?.error?.message ?? 'Login member diperlukan.');
  }

  async function loadThread(id: string) {
    const response = await fetch(`/api/hertz/messages/conversations/${id}`, { cache: 'no-store' });
    const payload = await response.json().catch(() => null);
    if (response.ok && payload?.success) setMessages(payload.data.messages);
  }

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
      setMembers([]);
      setQuery('');
      await loadInbox();
    }
  }

  async function send() {
    if (!activeId || (!body.trim() && attachments.length === 0)) return;
    await fetch(`/api/hertz/messages/conversations/${activeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body, attachments }),
    });
    setBody('');
    setAttachments([]);
    await loadThread(activeId);
    await loadInbox();
  }

  async function uploadImages(files: FileList | null) {
    if (!files?.length) return;
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
    void loadInbox();
  }, [filter]);

  useEffect(() => {
    if (!activeId) return undefined;
    void loadThread(activeId);
    const timer = window.setInterval(() => void loadThread(activeId), 7000);
    return () => window.clearInterval(timer);
  }, [activeId]);

  return (
    <main className={styles.main}>
      <SignalLeftRail currentUser={null} active="messages" />
      <aside className={styles.sidebar}>
        <h1>Direct Message</h1>
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
            <button className={styles.item} type="button" key={item.id} onClick={() => setActiveId(item.id)}>
              <strong>{item.peer?.displayName ?? `Conversation ${item.id.slice(0, 8)}`}</strong>
              <span>{item.lastMessageBody ?? 'Belum ada pesan'}</span>
              {item.unreadCount > 0 ? <em>{item.unreadCount}</em> : null}
            </button>
          ))}
        </div>
      </aside>
      <section className={styles.thread}>
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
            Image
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
          <button type="button" onClick={send} disabled={!activeId || uploading}>Send</button>
        </div>
      </section>
    </main>
  );
}
