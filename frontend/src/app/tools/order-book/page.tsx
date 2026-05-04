import type { Metadata } from 'next';
import { OrderBookToolPage } from '@/components/tools/OrderBookToolPage';

export const metadata: Metadata = {
  title: 'Order Book',
  description: 'Open orders dan open positions dari OANDA Labs.',
};

export default function OrderBookPage() {
  return <OrderBookToolPage />;
}
