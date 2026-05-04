import { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { PivotPointCalculator } from '@/components/pivot-point-calculator';

export const metadata: Metadata = {
  title: 'Pivot Point Calculator | HorizonFX',
  description: 'Calculate pivot points, support and resistance levels from OHLC data for forex and stock trading analysis.',
  keywords: 'pivot point, calculator, OHLC, support, resistance, forex, trading, technical analysis',
};

export default function PivotPointPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Page Header */}
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-bold text-foreground">
            Pivot Point Calculator
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Hitung pivot point, level support dan resistance dari data OHLC untuk analisis teknikal trading Anda.
          </p>
        </div>

        {/* Calculator Component */}
        <PivotPointCalculator />
        
        {/* Information Section */}
        <div className="mt-16 space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Tentang Pivot Point
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-lg border border-border/50 bg-card/30">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Apa itu Pivot Point?
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Pivot point adalah level harga yang dihitung berdasarkan data OHLC (Open, High, Low, Close) periode sebelumnya. 
                Digunakan untuk menentukan level support dan resistance potensial.
              </p>
            </div>
            
            <div className="p-6 rounded-lg border border-border/50 bg-card/30">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Support & Resistance
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                S1, S2, S3 adalah level support (dukungan) dimana harga cenderung memantul naik. 
                R1, R2, R3 adalah level resistance (perlawanan) dimana harga cenderung memantul turun.
              </p>
            </div>
            
            <div className="p-6 rounded-lg border border-border/50 bg-card/30">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Cara Penggunaan
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Masukkan data OHLC dari periode sebelumnya (hari, minggu, atau bulan). 
                Sistem akan menghitung pivot point dan level-level penting untuk trading Anda.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}