import { SkeletonLoader } from '@/components/ui/SkeletonLoader';

export default function HertzLoading() {
  return (
    <div style={{ minHeight: '100vh', background: '#0f0f14', padding: '1rem' }}>
      <SkeletonLoader variant="feed" />
    </div>
  );
}
