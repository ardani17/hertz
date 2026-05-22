import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

const OrderBookToolPage = dynamic(
  () => import('@/components/tools/OrderBookToolPage').then((mod) => mod.OrderBookToolPage),
  { loading: () => <p role="status">Memuat order book…</p> },
);

export const metadata: Metadata = {
  title: 'Order Book',
  description: 'Visualisasi order book dan likuiditas pasar.',
};

export default function OrderBookPage() {
  return <OrderBookToolPage />;
}
