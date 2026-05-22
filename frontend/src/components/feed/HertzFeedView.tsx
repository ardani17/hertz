import type { MemberSessionUser, HertzPostCategory } from '@shared/types';
import { HertzLayout } from '@/components/layout/HertzLayout';
import { SectionShell } from '@/components/spa/SectionShell';
import { HertzFeedClient } from './HertzFeedClient';
import { HertzFeedShell } from './HertzFeedShell';

export interface HertzFeedViewProps {
  currentUser: MemberSessionUser | null;
  activeCategory?: HertzPostCategory | string | null;
  activeSearch?: string | null;
  activeSort?: 'latest' | 'trending';
  initialPostShortId?: string | null;
}

export function HertzFeedView({
  currentUser,
  activeCategory,
  activeSearch,
  activeSort = 'latest',
  initialPostShortId = null,
}: HertzFeedViewProps) {
  return (
    <HertzLayout variant="feed" active="home" currentUser={currentUser}>
      <SectionShell section="hertz">
        <HertzFeedShell currentUser={currentUser} initialPostShortId={initialPostShortId}>
          <HertzFeedClient
            currentUser={currentUser}
            activeCategory={activeCategory}
            activeSearch={activeSearch}
            activeSort={activeSort}
          />
        </HertzFeedShell>
      </SectionShell>
    </HertzLayout>
  );
}
