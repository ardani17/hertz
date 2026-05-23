import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tools',
  description: 'Kalkulator dan tracker trading Horizon — pivot, profitability, challenge, Elliott wave.',
  alternates: {
    canonical: '/tools',
  },
};

/** Body rendered by ToolsLayoutChrome SPA; this route only anchors /tools. */
export default function ToolsPage() {
  return null;
}
