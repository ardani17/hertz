import { Metadata } from 'next';
import EconomicCalendarTable from '@/components/economic-calendar-table';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: 'Economic Calendar - HorizonFX',
  description: 'Stay updated with the latest economic events and market-moving news',
};

export default function EconomicCalendarPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Economic Calendar
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Stay informed with high-impact economic events and market-moving news from around the world
            </p>
          </div>
          
          <EconomicCalendarTable />
        </div>
      </main>
      <Footer />
    </div>
  );
}