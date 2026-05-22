'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { buildHertzPostPath } from '@/lib/hertzPostSpa';

export type HertzPostContextValue = {
  openPost: (shortId: string) => void;
  closePost: () => void;
};

const HertzPostContext = createContext<HertzPostContextValue | null>(null);

export function HertzPostProvider({
  openPost,
  closePost,
  children,
}: {
  openPost: (shortId: string) => void;
  closePost: () => void;
  children: ReactNode;
}) {
  return (
    <HertzPostContext.Provider value={{ openPost, closePost }}>{children}</HertzPostContext.Provider>
  );
}

export function useHertzPost(): HertzPostContextValue {
  const context = useContext(HertzPostContext);
  if (!context) {
    throw new Error('useHertzPost must be used within HertzPostProvider');
  }
  return context;
}

/** Safe on pages without feed shell — falls back to full navigation. */
export function useHertzPostNavigation(): HertzPostContextValue {
  const context = useContext(HertzPostContext);
  return {
    openPost: (shortId: string) => {
      if (context) {
        context.openPost(shortId);
        return;
      }
      window.location.assign(buildHertzPostPath(shortId));
    },
    closePost: () => {
      context?.closePost();
    },
  };
}
