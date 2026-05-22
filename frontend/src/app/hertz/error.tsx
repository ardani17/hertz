'use client';

import { ErrorPage } from '@/components/ui/ErrorPage';

export default function HertzError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--horizon-bg-base)' }}>
      <ErrorPage statusCode={500} onRetry={reset} showHomeLink />
    </div>
  );
}
