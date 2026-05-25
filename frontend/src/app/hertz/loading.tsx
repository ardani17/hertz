import { SkeletonLoader } from '@/components/ui/SkeletonLoader';

export default function HertzLoading() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--hertz-bg-base)', padding: '1rem' }}>
      <SkeletonLoader variant="feed" />
    </div>
  );
}
