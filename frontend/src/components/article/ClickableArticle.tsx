'use client';

import { useRouter } from 'next/navigation';
import type { MouseEvent, ReactNode } from 'react';

function isInteractiveElement(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('a, button, input, textarea, select, label, summary, [role="button"]'));
}

export function ClickableArticle({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: ReactNode;
}) {
  const router = useRouter();

  function openArticle(event: MouseEvent<HTMLElement>) {
    if (event.defaultPrevented || isInteractiveElement(event.target)) return;
    const selection = window.getSelection()?.toString().trim();
    if (selection) return;
    if (event.metaKey || event.ctrlKey) {
      window.open(href, '_blank', 'noopener,noreferrer');
      return;
    }
    router.push(href);
  }

  return (
    <article className={className} onClick={openArticle}>
      {children}
    </article>
  );
}
