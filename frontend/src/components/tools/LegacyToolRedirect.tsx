'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { PublishedToolSlug } from '@/lib/tools/catalog';
import { TOOLS_HUB_PATH, TOOLS_PENDING_STORAGE_KEY } from '@/lib/tools/catalog';
import { useToolsSpa } from './ToolsSpaContext';

/** Legacy /tools/:slug URLs → /tools with tool restored from sessionStorage. */
export function LegacyToolRedirect({ slug }: { slug: PublishedToolSlug }) {
  const router = useRouter();
  const { openTool } = useToolsSpa();

  useEffect(() => {
    try {
      window.sessionStorage.setItem(TOOLS_PENDING_STORAGE_KEY, slug);
    } catch {
      /* ignore */
    }
    openTool(slug);
    router.replace(TOOLS_HUB_PATH);
  }, [openTool, router, slug]);

  return null;
}
