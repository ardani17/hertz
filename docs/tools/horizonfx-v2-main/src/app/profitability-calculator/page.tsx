import { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import ProfitabilityCalculator from '@/components/profitability-calculator';

export const metadata: Metadata = {
  title: 'Profitability Calculator | HorizonFX',
  description: 'Advanced profitability and probability calculator with Monte Carlo simulation for forex trading analysis.',
  keywords: 'profitability calculator, trading calculator, Monte Carlo simulation, risk analysis, forex calculator',
};

export default function ProfitabilityCalculatorPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Profitability & Probability Calculator
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Analyze your trading strategy with advanced Monte Carlo simulation. 
              Calculate expected returns, risk metrics, and probability distributions for informed trading decisions.
            </p>
          </div>
          
          <ProfitabilityCalculator />
        </div>
      </main>
      <Footer />
    </div>
  );
}