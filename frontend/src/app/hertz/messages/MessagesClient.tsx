'use client';

import { Suspense } from 'react';
import { SectionShell } from '@/components/spa/SectionShell';
import { MessagesView } from '@/features/hertz/messages/MessagesView';
import styles from '@/features/hertz/messages/messages.module.css';

function MessagesFallback() {
  return (
    <section className={styles.guestPanel} role="status" aria-label="Memuat pesan">
      <span>Memuat...</span>
    </section>
  );
}

export { HERTZ_DM_POLL_INTERVAL_MS, canAddDmImages, formatDmTimestamp, getDmAccessState, getDmInitial, getDmMessageSide, getDmPreviewText, getDmThreadMenuActions } from '@/features/hertz/messages/dm-utils';

export function HertzMessagesClient() {
  return (
    <SectionShell section="messages">
      <Suspense fallback={<MessagesFallback />}>
        <MessagesView />
      </Suspense>
    </SectionShell>
  );
}
