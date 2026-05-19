import { SkeletonLoader } from '@/components/ui/SkeletonLoader';

export default function ToolsLoading() {
  return (
    <div style={{ minHeight: '100vh', background: '#0f0f14', padding: '1.5rem' }}>
      <SkeletonLoader variant="article" />
    </div>
  );
}
