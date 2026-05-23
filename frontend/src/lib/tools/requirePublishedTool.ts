import { notFound } from 'next/navigation';
import { isPublishedToolPath } from '@/lib/tools/catalog';

/** Guard server tool pages — hidden tools return 404. */
export function requirePublishedToolPath(pathname: string): void {
  if (!isPublishedToolPath(pathname)) {
    notFound();
  }
}
