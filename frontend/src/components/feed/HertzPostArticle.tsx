'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode, MouseEvent } from 'react';
import { shouldOpenDesktopPostModal } from '@/lib/hertzPostDetailUi';

function isInteractiveElement(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('a, button, input, textarea, select, label, summary, [role="button"]'));
}

export function HertzPostArticle({
  href,
  className,
  children,
  onDesktopOpen,
}: {
  href: string;
  className: string;
  children: ReactNode;
  onDesktopOpen?: () => void;
}) {
  const router = useRouter();

  function openPost(event: MouseEvent<HTMLElement>) {
    if (event.defaultPrevented || isInteractiveElement(event.target)) return;
    const selection = window.getSelection()?.toString().trim();
    if (selection) return;
    if (event.metaKey || event.ctrlKey) {
      window.open(href, '_blank', 'noopener,noreferrer');
      return;
    }
    if (onDesktopOpen && shouldOpenDesktopPostModal(window.innerWidth)) {
      onDesktopOpen();
      return;
    }
    router.push(href);
  }

  return (
    <article className={className} onClick={openPost}>
      {children}
    </article>
  );
}
