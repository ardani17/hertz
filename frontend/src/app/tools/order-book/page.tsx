import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Tool tidak tersedia',
};

export default function OrderBookPage() {
  notFound();
}
