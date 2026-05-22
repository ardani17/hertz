import { SkeletonLoader } from '@/components/ui/SkeletonLoader';

export default function HertzLoading() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--horizon-bg-base)', padding: '1rem' }}>
      <SkeletonLoader variant="feed" />
    </div>
  );
}
