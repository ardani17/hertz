import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function getFocusTrapNextIndex({
  currentIndex,
  itemCount,
  backwards,
}: {
  currentIndex: number;
  itemCount: number;
  backwards: boolean;
}) {
  if (itemCount <= 0) return -1;
  if (currentIndex < 0) return backwards ? itemCount - 1 : 0;
  return backwards
    ? (currentIndex - 1 + itemCount) % itemCount
    : (currentIndex + 1) % itemCount;
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter((element) => element.getAttribute('aria-hidden') !== 'true');
}

export function focusFirstDescendant(container: HTMLElement | null): void {
  if (!container) return;
  getFocusableElements(container)[0]?.focus();
}

export function trapFocusWithin(container: HTMLElement, event: ReactKeyboardEvent): void {
  if (event.key !== 'Tab') return;
  const focusable = getFocusableElements(container);
  if (focusable.length === 0) {
    event.preventDefault();
    return;
  }
  event.preventDefault();
  const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
  const nextIndex = getFocusTrapNextIndex({
    currentIndex,
    itemCount: focusable.length,
    backwards: event.shiftKey,
  });
  focusable[nextIndex]?.focus();
}
