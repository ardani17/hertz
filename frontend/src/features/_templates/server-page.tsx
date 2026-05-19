/**
 * Template: thin server page (App Router).
 * Copy to app/<route>/page.tsx — do not import from app in features.
 */
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Title | Horizon',
  description: 'Description',
};

export default async function ExamplePage() {
  // const data = await someService.get();
  return null; // <ExampleView data={data} />
}
