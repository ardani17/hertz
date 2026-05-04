import { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import ElliotWaveCalculator from '@/components/elliot-wave-calculator';

export const metadata: Metadata = {
  title: 'Elliott Wave Calculator - Advanced Technical Analysis Tool',
  description: 'Calculate Elliott Wave levels with advanced technical analysis. Get precise buy/sell recommendations based on Elliott Wave theory for better trading decisions.',
  keywords: 'elliott wave, technical analysis, trading calculator, wave analysis, fibonacci, support resistance',
};

export default function ElliotCalculatorPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Advanced Elliott Wave Calculator
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Analisis teknikal tingkat lanjut menggunakan teori Elliott Wave untuk menentukan level support dan resistance yang akurat.
          </p>
        </div>

        {/* Calculator Component */}
        <div className="max-w-6xl mx-auto">
          <ElliotWaveCalculator />
        </div>

        {/* Educational Content */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-card rounded-lg border p-8">
            <h2 className="text-2xl font-semibold text-foreground mb-6">
              Tentang Elliott Wave Theory
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-medium text-foreground mb-3">
                  Apa itu Elliott Wave?
                </h3>
                <p className="text-muted-foreground mb-4">
                  Elliott Wave adalah teori analisis teknikal yang mengidentifikasi pola pergerakan harga dalam bentuk gelombang. 
                  Teori ini membantu trader memahami psikologi pasar dan memprediksi pergerakan harga selanjutnya.
                </p>
                
                <h3 className="text-lg font-medium text-foreground mb-3">
                  Struktur Gelombang
                </h3>
                <ul className="text-muted-foreground space-y-2">
                  <li>• <strong>Wave 1-5:</strong> Gelombang impulsif (searah trend)</li>
                  <li>• <strong>Wave A-C:</strong> Gelombang korektif (berlawanan trend)</li>
                  <li>• <strong>Fibonacci Ratios:</strong> Menentukan target dan level</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-foreground mb-3">
                  Cara Menggunakan Calculator
                </h3>
                <ol className="text-muted-foreground space-y-2">
                  <li>1. Masukkan data OHLC hari sebelumnya</li>
                  <li>2. Masukkan data Open/WAP hari ini</li>
                  <li>3. Klik &quot;Find Values&quot; untuk menghitung</li>
                  <li>4. Analisis rekomendasi buy/sell yang diberikan</li>
                  <li>5. Gunakan level support/resistance untuk trading</li>
                </ol>
                
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Catatan:</strong> Calculator ini menggunakan algoritma Elliott Wave yang telah dioptimasi 
                    dengan rasio Fibonacci untuk memberikan hasil yang akurat.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}