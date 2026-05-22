'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { PublicProfileDto } from '@shared/services/hertzPublicProfileService';
import { DM_CONVERSATION_SESSION_KEY, setSessionValue } from '@/lib/spa/canonicalUrl';
import styles from './PublicProfileView.module.css';

export function PublicProfileDmButton({
  dto,
  viewerId,
}: {
  dto: PublicProfileDto;
  viewerId: string | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  if (dto.isSelf) return null;

  if (!viewerId) {
    const redirect = encodeURIComponent(`/@${dto.username}`);
    return (
      <a href={`/admin/login?redirect=${redirect}`} className={styles.cta}>
        Login untuk kirim DM
      </a>
    );
  }

  async function startDm() {
    setPending(true);
    try {
      const response = await fetch('/api/hertz/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientUsername: dto.username }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) return;
      setSessionValue(DM_CONVERSATION_SESSION_KEY, payload.data.conversation.id);
      router.push('/hertz/messages');
    } finally {
      setPending(false);
    }
  }

  return (
    <button type="button" className={styles.cta} disabled={pending} onClick={() => void startDm()}>
      {pending ? 'Membuka…' : 'Kirim DM'}
    </button>
  );
}
