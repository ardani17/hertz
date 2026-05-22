import { SkeletonLoader } from '@/components/ui/SkeletonLoader';

export default function ToolsLoading() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--horizon-bg-base)', padding: '1.5rem' }}>
      <SkeletonLoader variant="article" />
    </div>
  );
}
