'use client';

import { Bell } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { MemberSessionUser } from '@shared/types';
import { useNotificationSummary } from '@/lib/swr/hooks/useNotifications';
import { NotificationDropdown } from './NotificationDropdown';
import { NotificationDropdownMobile } from './NotificationDropdown.mobile';
import styles from './NotificationBell.module.css';

export function NotificationBell({
  currentUser,
  className,
}: {
  currentUser: MemberSessionUser | null;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { data } = useNotificationSummary(Boolean(currentUser));
  const unread = Number(data?.unreadCount ?? 0);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1024px)');
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [open]);

  if (!currentUser) return null;

  const Dropdown = isMobile ? NotificationDropdownMobile : NotificationDropdown;

  return (
    <div ref={rootRef} className={className} style={{ position: 'relative' }}>
      <button
        type="button"
        className={styles.bell}
        aria-label="Notifikasi"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell size={24} />
        {unread > 0 ? <span className={styles.badge}>{unread > 99 ? '99+' : unread}</span> : null}
      </button>
      {open ? <Dropdown onClose={() => setOpen(false)} /> : null}
    </div>
  );
}
