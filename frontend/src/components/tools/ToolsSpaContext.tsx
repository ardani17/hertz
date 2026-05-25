'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { PublishedToolSlug } from '@/lib/tools/catalog';
import {
  getPublishedToolBySlug,
  TOOLS_ACTIVE_STORAGE_KEY,
  TOOLS_PENDING_STORAGE_KEY,
} from '@/lib/tools/catalog';

type ToolsSpaContextValue = {
  activeTool: PublishedToolSlug | null;
  openHub: () => void;
  openTool: (slug: PublishedToolSlug) => void;
};

const ToolsSpaContext = createContext<ToolsSpaContextValue | null>(null);

function readStoredTool(): PublishedToolSlug | null {
  if (typeof window === 'undefined') return null;
  try {
    const pending = window.sessionStorage.getItem(TOOLS_PENDING_STORAGE_KEY);
    if (pending) {
      window.sessionStorage.removeItem(TOOLS_PENDING_STORAGE_KEY);
      const tool = getPublishedToolBySlug(pending);
      if (tool) return tool.slug;
    }
    const stored = window.sessionStorage.getItem(TOOLS_ACTIVE_STORAGE_KEY);
    if (!stored) return null;
    return getPublishedToolBySlug(stored)?.slug ?? null;
  } catch {
    return null;
  }
}

function writeStoredTool(slug: PublishedToolSlug | null) {
  if (typeof window === 'undefined') return;
  try {
    if (slug) {
      window.sessionStorage.setItem(TOOLS_ACTIVE_STORAGE_KEY, slug);
    } else {
      window.sessionStorage.removeItem(TOOLS_ACTIVE_STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }
}

export function ToolsSpaProvider({ children }: { children: ReactNode }) {
  const [activeTool, setActiveTool] = useState<PublishedToolSlug | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setActiveTool(readStoredTool());
    setHydrated(true);
  }, []);

  const openHub = useCallback(() => {
    setActiveTool(null);
    writeStoredTool(null);
  }, []);

  const openTool = useCallback((slug: PublishedToolSlug) => {
    setActiveTool(slug);
    writeStoredTool(slug);
  }, []);

  const value = useMemo(
    () => ({ activeTool: hydrated ? activeTool : null, openHub, openTool }),
    [activeTool, hydrated, openHub, openTool],
  );

  return <ToolsSpaContext.Provider value={value}>{children}</ToolsSpaContext.Provider>;
}

export function useToolsSpa() {
  const ctx = useContext(ToolsSpaContext);
  if (!ctx) {
    throw new Error('useToolsSpa must be used within ToolsSpaProvider');
  }
  return ctx;
}
