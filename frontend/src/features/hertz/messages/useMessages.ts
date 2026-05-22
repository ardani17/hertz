'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  consumeSessionValue,
  DM_CONVERSATION_SESSION_KEY,
  replaceCanonicalPath,
  setSessionValue,
} from '@/lib/spa/canonicalUrl';
import { useToast } from '@/components/ui/Toast';
import { useAuthMe } from '@/lib/swr/hooks/useAuthMe';
import { useDmInbox } from '@/lib/swr/hooks/useDmInbox';
import { useDmThread } from '@/lib/swr/hooks/useDmThread';
import { canAddDmImages } from './dm-utils';
import type { Conversation, DmFilter, MemberResult, PendingAttachment } from './types';

type InboxPayload = { conversations: Conversation[] };

export function useMessages() {
  const router = useRouter();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const { data: meData, isLoading: meLoading } = useAuthMe();
  const currentUser = meData?.user ?? null;
  const authState = meLoading ? 'loading' : currentUser ? 'member' : 'guest';

  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<DmFilter>('inbox');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
  const [threadMenuOpen, setThreadMenuOpen] = useState(false);
  const [members, setMembers] = useState<MemberResult[]>([]);

  const inbox = useDmInbox<InboxPayload>(filter, authState === 'member');
  const conversations = inbox.data?.conversations ?? [];
  const thread = useDmThread(activeId);
  const messages = thread.messages;

  const activeConversation = conversations.find((item) => item.id === activeId) ?? null;

  useEffect(() => {
    if (authState !== 'member' || conversations.length === 0) return;
    setActiveId((current) => current ?? conversations[0]?.id ?? null);
  }, [authState, conversations]);

  useEffect(() => {
    if (authState !== 'member') return;

    const conversationParam = searchParams.get('conversation');
    const sessionConversation = consumeSessionValue(DM_CONVERSATION_SESSION_KEY);
    const conversationId = conversationParam ?? sessionConversation;
    if (!conversationId) return;

    setActiveId(conversationId);
    setMobileThreadOpen(true);
    if (conversationParam) {
      replaceCanonicalPath('/hertz/messages');
      router.replace('/hertz/messages', { scroll: false });
    }
    const timer = window.setTimeout(() => composerRef.current?.focus(), 120);
    return () => window.clearTimeout(timer);
  }, [searchParams, authState, router]);

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
      const conversationId = payload.data.conversation.id as string;
      setActiveId(conversationId);
      setSessionValue(DM_CONVERSATION_SESSION_KEY, conversationId);
      setMobileThreadOpen(true);
      setMembers([]);
      setQuery('');
      await inbox.mutate();
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
    await thread.mutate();
    await inbox.mutate();
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
    thread.resetThread();
    await inbox.mutate();
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
    if (activeId) await thread.mutate();
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

  return {
    currentUser,
    authState,
    conversations,
    members,
    activeId,
    setActiveId,
    messages,
    threadLoading: thread.isLoading,
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
    composerRef,
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
