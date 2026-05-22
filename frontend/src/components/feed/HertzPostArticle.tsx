'use client';

import type { ReactNode, MouseEvent, KeyboardEvent } from 'react';
import { useHertzPostNavigation } from './HertzPostContext';

function isInteractiveElement(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(target.closest('a, button, input, textarea, select, label, summary, [role="button"]'))
  );
}

export function HertzPostArticle({
  href,
  className,
  children,
  onOpenPost,
}: {
  href: string;
  className: string;
  children: ReactNode;
  onOpenPost?: () => void;
}) {
  const { openPost } = useHertzPostNavigation();

  function navigate() {
    if (onOpenPost) {
      onOpenPost();
      return;
    }
    const shortId = href.split('/').pop();
    if (shortId) openPost(shortId);
  }

  function handleActivate(event: MouseEvent<HTMLElement>) {
    if (event.defaultPrevented || isInteractiveElement(event.target)) return;
    const selection = window.getSelection()?.toString().trim();
    if (selection) return;
    if (event.metaKey || event.ctrlKey) {
      window.open(href, '_blank', 'noopener,noreferrer');
      return;
    }
    navigate();
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    if (isInteractiveElement(event.target)) return;
    event.preventDefault();
    navigate();
  }

  return (
    <article
      className={className}
      role="link"
      tabIndex={0}
      onClick={handleActivate}
      onKeyDown={onKeyDown}
      aria-label="Buka detail postingan"
    >
      {children}
    </article>
  );
}
