import { SkeletonLoader } from '@/components/ui/SkeletonLoader';

export default function AdminLoading() {
  return (
    <div style={{ padding: '1.5rem' }}>
      <SkeletonLoader variant="article" />
    </div>
  );
}
