'use client';

import { ErrorPage } from '@/components/ui/ErrorPage';

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return <ErrorPage statusCode={500} onRetry={reset} />;
}
