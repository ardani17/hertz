'use client';

import { useCallback, useEffect, useState } from 'react';
import type { MemberSessionUser } from '@shared/types';
import { useToast } from '@/components/ui/Toast';
import { canAddDmImages, HERTZ_DM_POLL_INTERVAL_MS } from './dm-utils';
import type { Conversation, DmFilter, MemberResult, Message, PendingAttachment } from './types';

export function useMessages() {
  const { showToast } = useToast();
  const [currentUser, setCurrentUser] = useState<MemberSessionUser | null>(null);
  const [authState, setAuthState] = useState<'loading' | 'guest' | 'member'>('loading');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [members, setMembers] = useState<MemberResult[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<DmFilter>('inbox');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
  const [threadMenuOpen, setThreadMenuOpen] = useState(false);

  const activeConversation = conversations.find((item) => item.id === activeId) ?? null;

  const loadCurrentUser = useCallback(async () => {
    const response = await fetch('/api/auth/me', { cache: 'no-store' });
    const payload = await response.json().catch(() => null);
    const user = response.ok && payload?.success ? payload.data.user ?? null : null;
    setCurrentUser(user);
    setAuthState(user ? 'member' : 'guest');
  }, []);

  const loadInbox = useCallback(async () => {
    const response = await fetch(`/api/hertz/messages/inbox${filter === 'archived' ? '?archived=1' : ''}`, {
      cache: 'no-store',
    });
    const payload = await response.json().catch(() => null);
    if (response.ok && payload?.success) {
      setConversations(payload.data.conversations);
      setActiveId((current) => current ?? payload.data.conversations[0]?.id ?? null);
    } else {
      const msg = payload?.error?.message ?? 'Login member diperlukan.';
      setStatus(msg);
      showToast(msg, 'error');
    }
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
    const response = await fetch(`/api/hertz/messages/conversations?q=${encodeURIComponent(value)}`, {
      cache: 'no-store',
    });
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
      showToast(payload?.error?.message ?? 'Pesan gagal dikirim.', 'error');
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
    setStatus(
      response.ok && payload?.success ? 'Member diblokir dari DM.' : payload?.error?.message ?? 'Block gagal.',
    );
  }

  async function deleteMessage(messageId: string) {
    const response = await fetch(`/api/hertz/messages/messages/${messageId}`, { method: 'DELETE' });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      showToast(payload?.error?.message ?? 'Pesan gagal dihapus.', 'error');
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
    showToast(
      response.ok && payload?.success ? 'Laporan DM masuk ke review admin.' : payload?.error?.message ?? 'Laporan gagal.',
      response.ok && payload?.success ? 'success' : 'error',
    );
  }

  async function uploadImages(files: FileList | null) {
    if (!files?.length) return;
    if (!canAddDmImages(attachments.length, files.length)) {
      showToast('Maksimal 4 gambar per pesan.', 'warning');
      return;
    }
    const nextFiles = Array.from(files).slice(0, Math.max(0, 4 - attachments.length));
    if (nextFiles.length === 0) {
      showToast('Maksimal 4 gambar per pesan.', 'warning');
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
      showToast(error instanceof Error ? error.message : 'Gagal mengunggah gambar DM.', 'error');
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

  return {
    currentUser,
    authState,
    conversations,
    members,
    activeId,
    setActiveId,
    messages,
    query,
    filter,
    setFilter,
    body,
    setBody,
    attachments,
    setAttachments,
    uploading,
    status,
    mobileThreadOpen,
    setMobileThreadOpen,
    threadMenuOpen,
    setThreadMenuOpen,
    activeConversation,
    searchMembers,
    startConversation,
    send,
    archiveConversation,
    blockPeer,
    deleteMessage,
    reportMessage,
    uploadImages,
  };
}
