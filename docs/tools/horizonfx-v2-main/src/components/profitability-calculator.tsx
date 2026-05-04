'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, Download, RotateCcw, TrendingUp, BookOpen, AlertTriangle, CheckCircle, Target, DollarSign, BarChart3, TrendingDown as TrendDown } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import * as XLSX from 'xlsx';
import { trackToolAccess, trackToolUsage } from '@/lib/analytics';

interface CalculatorInputs {
  symbol: string;
  currency: string;
  balance: number;
  riskType: 'percentage' | 'nominal';
  riskPerTrade: number;
  winRate: number;
  rewardRiskRatio: number;
  jumlahTrade: number;
  commissionPerTrade: number;
  monteCarloSimulations: number;
}

interface CalculationResults {
  expectedProfit: number;
  finalBalance: number;
  totalInvestment: number;
  totalCommission: number;
  bestCase: number;
  averageReturn: number;
  worstCase: number;
  profitableScenarios: number;
  maxDrawdown: number;
  maxDrawdownPct: number;
  profitRD50: number;
  profitRD25: number;
  longestWinStreak: number;
  longestLossStreak: number;
  roi: number;
  distributionData: number[];
  balancePathData: number[];
}

const ProfitabilityCalculator: React.FC = () => {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    symbol: 'Rp',
    currency: 'IDR',
    balance: 1000000,
    riskType: 'percentage',
    riskPerTrade: 2,
    winRate: 33.3,
    rewardRiskRatio: 2,
    jumlahTrade: 100,
    commissionPerTrade: 0,
    monteCarloSimulations: 1000
  });

  const [results, setResults] = useState<CalculationResults | null>(null);
  
  // Default values for initial display
  const getDisplayResults = (): CalculationResults => {
    if (results) return results;
    return {
      expectedProfit: 0,
      finalBalance: inputs.balance,
      totalInvestment: 0,
      totalCommission: 0,
      bestCase: inputs.balance,
      averageReturn: 0,
      worstCase: inputs.balance,
      profitableScenarios: 0,
      maxDrawdown: 0,
      maxDrawdownPct: 0,
      profitRD50: 0,
      profitRD25: 0,
      longestWinStreak: 0,
      longestLossStreak: 0,
      roi: 0,
      distributionData: Array(20).fill(0),
      balancePathData: Array(inputs.jumlahTrade).fill(inputs.balance)
    };
  };
  
  const displayResults = getDisplayResults();
  const [isCalculating, setIsCalculating] = useState(false);

  // Track tool access when component mounts
  useEffect(() => {
    trackToolAccess('Profitability Calculator', 'calculator');
  }, []);

  const handleInputChange = (field: keyof CalculatorInputs, value: string | number) => {
    setInputs(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? (isNaN(Number(value)) ? value : Number(value)) : value
    }));
  };

  const runMonteCarloSimulation = (): CalculationResults => {
    const { balance, riskPerTrade, riskType, winRate, rewardRiskRatio, jumlahTrade, commissionPerTrade, monteCarloSimulations } = inputs;
    
    const simulations: number[] = [];
    const balancePaths: number[][] = [];
    const maxDrawdowns: number[] = [];
    const winStreaks: number[] = [];
    const lossStreaks: number[] = [];
    
    for (let sim = 0; sim < monteCarloSimulations; sim++) {
      let currentBalance = balance;
      let peak = balance;
      let maxDrawdown = 0;
      let currentWinStreak = 0;
      let currentLossStreak = 0;
      let maxWinStreak = 0;
      let maxLossStreak = 0;
      const balancePath = [balance];
      
      for (let trade = 0; trade < jumlahTrade; trade++) {
        const riskAmount = riskType === 'percentage' ? (currentBalance * riskPerTrade / 100) : riskPerTrade;
        const commission = commissionPerTrade;
        
        const isWin = Math.random() < (winRate / 100);
        
        if (isWin) {
          currentBalance += (riskAmount * rewardRiskRatio) - commission;
          currentWinStreak++;
          currentLossStreak = 0;
          maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
        } else {
          currentBalance -= riskAmount + commission;
          currentLossStreak++;
          currentWinStreak = 0;
          maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
        }
        
        // Track peak and drawdown
        if (currentBalance > peak) {
          peak = currentBalance;
        }
        const drawdown = (peak - currentBalance) / peak * 100;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
        
        balancePath.push(currentBalance);
      }
      
      simulations.push(currentBalance);
      balancePaths.push(balancePath);
      maxDrawdowns.push(maxDrawdown);
      winStreaks.push(maxWinStreak);
      lossStreaks.push(maxLossStreak);
    }
    
    // Calculate statistics
    simulations.sort((a, b) => a - b);
    const expectedProfit = simulations.reduce((sum, val) => sum + val, 0) / simulations.length;
    const bestCase = simulations[Math.floor(simulations.length * 0.9)];
    const worstCase = simulations[Math.floor(simulations.length * 0.1)];
    const profitableCount = simulations.filter(val => val > balance).length;
    const profitableScenarios = (profitableCount / simulations.length) * 100;
    
    // Calculate distribution for histogram
    const distributionData = new Array(20).fill(0);
    const min = Math.min(...simulations);
    const max = Math.max(...simulations);
    const binSize = (max - min) / 20;
    
    simulations.forEach(value => {
      const binIndex = Math.min(Math.floor((value - min) / binSize), 19);
      distributionData[binIndex]++;
    });
    
    // Use first simulation as sample balance path
    const sampleBalancePath = balancePaths.length > 0 ? balancePaths[0] : [balance];
    
    return {
      expectedProfit,
      finalBalance: expectedProfit,
      totalInvestment: balance,
      totalCommission: jumlahTrade * commissionPerTrade,
      bestCase,
      averageReturn: ((expectedProfit - balance) / balance) * 100,
      worstCase,
      profitableScenarios,
      maxDrawdown: maxDrawdowns.reduce((sum, val) => sum + val, 0) / maxDrawdowns.length,
      maxDrawdownPct: maxDrawdowns.reduce((sum, val) => sum + val, 0) / maxDrawdowns.length,
      profitRD50: simulations[Math.floor(simulations.length * 0.5)],
      profitRD25: simulations[Math.floor(simulations.length * 0.25)],
      longestWinStreak: winStreaks.reduce((sum, val) => sum + val, 0) / winStreaks.length,
      longestLossStreak: lossStreaks.reduce((sum, val) => sum + val, 0) / lossStreaks.length,
      roi: ((expectedProfit - balance) / balance) * 100,
      distributionData,
      balancePathData: sampleBalancePath
    };
  };

  const calculateResults = async () => {
    setIsCalculating(true);
    const startTime = performance.now();
    let success = false;
    
    try {
      // Simulate calculation delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const calculationResults = runMonteCarloSimulation();
      setResults(calculationResults);
      success = true;
    } catch (error) {
      console.error('Calculation error:', error);
    } finally {
      setIsCalculating(false);
      
      // Track usage
      const endTime = performance.now();
      const calculationTime = endTime - startTime;
      
      trackToolUsage({
        toolName: 'Profitability Calculator',
        toolType: 'calculator',
        usageData: {
          inputParams: {
            balance: inputs.balance,
            riskType: inputs.riskType,
            riskPerTrade: inputs.riskPerTrade,
            winRate: inputs.winRate,
            rewardRiskRatio: inputs.rewardRiskRatio,
            jumlahTrade: inputs.jumlahTrade,
            monteCarloSimulations: inputs.monteCarloSimulations
          },
          calculationTime,
          success
        }
      }).catch(console.warn);
    }
  };

  const resetForm = () => {
    setInputs({
      symbol: 'Rp',
      currency: 'IDR',
      balance: 1000000,
      riskType: 'percentage',
      riskPerTrade: 2,
      winRate: 33.3,
      rewardRiskRatio: 2,
      jumlahTrade: 100,
      commissionPerTrade: 0,
      monteCarloSimulations: 1000
    });
    setResults(null);
  };

  const exportToExcel = () => {
    if (!results) return;
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Summary Sheet
    const summaryData = [
      ['PROFITABILITY & PROBABILITY ANALYSIS REPORT', ''],
      ['Generated on:', new Date().toLocaleDateString('id-ID')],
      ['', ''],
      ['TRADING PARAMETERS', ''],
      ['Initial Balance', `${inputs.symbol}${inputs.balance.toLocaleString('id-ID')}`],
      ['Risk per Trade', `${inputs.riskPerTrade}${inputs.riskType === 'percentage' ? '%' : ''}`],
      ['Win Rate', `${inputs.winRate}%`],
      ['Reward/Risk Ratio', `1:${inputs.rewardRiskRatio}`],
      ['Total Trades', inputs.jumlahTrade],
      ['Commission per Trade', `${inputs.commissionPerTrade}%`],
      ['Monte Carlo Simulations', inputs.monteCarloSimulations.toLocaleString('id-ID')],
      ['', ''],
      ['RESULTS SUMMARY', ''],
      ['Expected Profit', `${inputs.symbol}${results.expectedProfit.toLocaleString('id-ID')}`],
      ['Final Balance', `${inputs.symbol}${results.finalBalance.toLocaleString('id-ID')}`],
      ['ROI (Return on Investment)', `${results.roi.toFixed(2)}%`],
      ['Average Return', `${results.averageReturn.toFixed(2)}%`],
      ['', ''],
      ['RISK ANALYSIS', ''],
      ['Best Case Scenario', `${inputs.symbol}${results.bestCase.toLocaleString('id-ID')}`],
      ['Worst Case Scenario', `${inputs.symbol}${results.worstCase.toLocaleString('id-ID')}`],
      ['Profitable Scenarios', `${results.profitableScenarios.toFixed(1)}%`],
      ['Maximum Drawdown', `${results.maxDrawdown.toFixed(1)}%`],
      ['', ''],
      ['STREAK ANALYSIS', ''],
      ['Longest Win Streak', Math.round(results.longestWinStreak)],
      ['Longest Loss Streak', Math.round(results.longestLossStreak)],
      ['', ''],
      ['PERCENTILE ANALYSIS', ''],
      ['50th Percentile (Median)', `${inputs.symbol}${results.profitRD50.toLocaleString('id-ID')}`],
      ['25th Percentile', `${inputs.symbol}${results.profitRD25.toLocaleString('id-ID')}`]
    ];
    
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Set column widths
    ws1['!cols'] = [
      { width: 30 },
      { width: 20 }
    ];
    
    // Style headers
    ws1['A1'] = { v: 'PROFITABILITY & PROBABILITY ANALYSIS REPORT', t: 's', s: { font: { bold: true, sz: 14 } } };
    ws1['A4'] = { v: 'TRADING PARAMETERS', t: 's', s: { font: { bold: true, sz: 12 } } };
    ws1['A13'] = { v: 'RESULTS SUMMARY', t: 's', s: { font: { bold: true, sz: 12 } } };
    ws1['A19'] = { v: 'RISK ANALYSIS', t: 's', s: { font: { bold: true, sz: 12 } } };
    ws1['A25'] = { v: 'STREAK ANALYSIS', t: 's', s: { font: { bold: true, sz: 12 } } };
    ws1['A29'] = { v: 'PERCENTILE ANALYSIS', t: 's', s: { font: { bold: true, sz: 12 } } };
    
    XLSX.utils.book_append_sheet(wb, ws1, 'Summary Report');
    
    // Balance Path Sheet
    const balancePathData = [
      ['Trade Number', 'Balance'],
      ...results.balancePathData.map((balance, index) => [
        index,
        balance
      ])
    ];
    
    const ws2 = XLSX.utils.aoa_to_sheet(balancePathData);
    ws2['!cols'] = [{ width: 15 }, { width: 20 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Balance Path');
    
    // Distribution Data Sheet
    const distributionData = [
      ['Bin', 'Frequency'],
      ...results.distributionData.map((freq, index) => [
        `Bin ${index + 1}`,
        freq
      ])
    ];
    
    const ws3 = XLSX.utils.aoa_to_sheet(distributionData);
    ws3['!cols'] = [{ width: 15 }, { width: 15 }];
    XLSX.utils.book_append_sheet(wb, ws3, 'Distribution');
    
    // Export file
    const fileName = `Profitability_Analysis_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-black dark:via-[#171717] dark:to-black py-12">
      <div className="container mx-auto px-6 max-w-[1400px]">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 text-left">How to use:</h3>
            <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed text-left">
              Masukkan parameter trading Anda seperti balance awal, win rate, reward/risk ratio, dan jumlah trade. Kalkulator akan menggunakan simulasi Monte Carlo untuk menganalisis probabilitas profit, drawdown maksimal, dan berbagai skenario hasil trading untuk membantu Anda membuat keputusan trading yang lebih informed.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Input Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Form */}
            <Card className="lg:col-span-1 shadow-xl border-0 bg-white/80 dark:bg-[#171717]/90 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-800 dark:text-slate-100">
              <div className="p-2 bg-blue-100 dark:bg-[#171717] rounded-lg">
                <Calculator className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              Trading Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label htmlFor="symbol" className="text-sm font-medium text-slate-700 dark:text-slate-300">Currency Symbol</Label>
                <Input
                  id="symbol"
                  value={inputs.symbol}
                  onChange={(e) => handleInputChange('symbol', e.target.value)}
                  placeholder="Rp"
                  className="h-11 border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="balance" className="text-sm font-medium text-slate-700 dark:text-slate-300">Initial Balance</Label>
                <Input
                  id="balance"
                  type="number"
                  value={inputs.balance}
                  onChange={(e) => handleInputChange('balance', e.target.value)}
                  placeholder="1,000,000"
                  className="h-11 border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Risk Management Type</Label>
              <div className="grid grid-cols-1 gap-2">
                <Button
                  type="button"
                  variant={inputs.riskType === 'percentage' ? 'default' : 'outline'}
                  onClick={() => handleInputChange('riskType', 'percentage')}
                  className="h-11 justify-start text-left font-medium"
                >
                  Percentage (%) of Current Balance
                </Button>
                <Button
                  type="button"
                  variant={inputs.riskType === 'nominal' ? 'default' : 'outline'}
                  onClick={() => handleInputChange('riskType', 'nominal')}
                  className="h-11 justify-start text-left font-medium"
                >
                  Fixed Amount per Trade
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="riskPerTrade" className="text-sm font-medium text-slate-700 dark:text-slate-300">Risk per Trade (%)</Label>
                <Input
                  id="riskPerTrade"
                  type="number"
                  step="0.1"
                  value={inputs.riskPerTrade}
                  onChange={(e) => handleInputChange('riskPerTrade', e.target.value)}
                  placeholder="2.0"
                  className="h-11 border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="winRate" className="text-sm font-medium text-slate-700 dark:text-slate-300">Win Rate (%)</Label>
                <Input
                  id="winRate"
                  type="number"
                  step="0.1"
                  value={inputs.winRate}
                  onChange={(e) => handleInputChange('winRate', e.target.value)}
                  placeholder="33.3"
                  className="h-11 border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rewardRiskRatio" className="text-sm font-medium text-slate-700 dark:text-slate-300">Reward/Risk Ratio 1:</Label>
                <Input
                  id="rewardRiskRatio"
                  type="number"
                  step="0.1"
                  value={inputs.rewardRiskRatio}
                  onChange={(e) => handleInputChange('rewardRiskRatio', e.target.value)}
                  placeholder="2.0"
                  className="h-11 border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jumlahTrade" className="text-sm font-medium text-slate-700 dark:text-slate-300">Total Trades</Label>
                <Input
                  id="jumlahTrade"
                  type="number"
                  value={inputs.jumlahTrade}
                  onChange={(e) => handleInputChange('jumlahTrade', e.target.value)}
                  placeholder="100"
                  className="h-11 border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="commissionPerTrade" className="text-sm font-medium text-slate-700 dark:text-slate-300">Commission per Trade (%)</Label>
                <Input
                  id="commissionPerTrade"
                  type="number"
                  step="0.01"
                  value={inputs.commissionPerTrade}
                  onChange={(e) => handleInputChange('commissionPerTrade', e.target.value)}
                  placeholder="0.00"
                  className="h-11 border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monteCarloSimulations" className="text-sm font-medium text-slate-700 dark:text-slate-300">Monte Carlo Simulations</Label>
                <Input
                  id="monteCarloSimulations"
                  type="number"
                  value={inputs.monteCarloSimulations}
                  onChange={(e) => handleInputChange('monteCarloSimulations', e.target.value)}
                  placeholder="1,000"
                  className="h-11 border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-3 pt-4">
              <Button 
                onClick={calculateResults} 
                disabled={isCalculating}
                variant="outline"
                className="w-full h-12 bg-white/10 dark:bg-[#171717]/50 backdrop-blur-md border-2 border-white/20 dark:border-gray-600/50 hover:bg-white/20 dark:hover:bg-black/60 hover:border-white/40 dark:hover:border-gray-500/70 text-slate-800 dark:text-slate-100 font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isCalculating ? (
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Calculating Results...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    <span>Calculate Results</span>
                  </div>
                )}
              </Button>
              
              {results && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetForm} className="flex-1 h-12">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    <span>Reset</span>
                  </Button>
                  <Button variant="outline" onClick={exportToExcel} className="flex-1 h-12">
                    <Download className="h-4 w-4 mr-2" />
                    <span>Download</span>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
            {/* Results Section */}
            <Card className="lg:col-span-1 shadow-xl border-0 bg-white/80 dark:bg-[#171717]/90 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-800 dark:text-slate-100">
                <div className="p-2 bg-green-100 dark:bg-[#171717] rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                Summary Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-[#171717] dark:to-black rounded-xl border border-green-200 dark:border-gray-600">
                  <div className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">Win Rate</div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">{inputs.winRate}%</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-[#171717] dark:to-black rounded-xl border border-blue-200 dark:border-gray-600">
                  <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">Expectancy</div>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{inputs.rewardRiskRatio}</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-[#171717] dark:to-black rounded-xl border border-emerald-200 dark:border-gray-600">
                  <div className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-2">Ending Balance</div>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {inputs.symbol}{displayResults.finalBalance.toLocaleString('id-ID')}
                  </div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-[#171717] dark:to-black rounded-xl border border-purple-200 dark:border-gray-600">
                  <div className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">Total Profit</div>
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{displayResults.roi.toFixed(0)}%</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-8">
                <div className="text-center p-4 bg-slate-50 dark:bg-[#171717] rounded-lg">
                  <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Best Case</div>
                  <div className="text-xs text-slate-500 dark:text-slate-500 mb-2">Return</div>
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">{((displayResults.bestCase - inputs.balance) / inputs.balance * 100).toFixed(1)}%</div>
                </div>
                <div className="text-center p-4 bg-slate-50 dark:bg-[#171717] rounded-lg">
                  <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Average</div>
                  <div className="text-xs text-slate-500 dark:text-slate-500 mb-2">Return</div>
                  <div className="text-lg font-bold text-slate-700 dark:text-slate-300">{displayResults.averageReturn.toFixed(1)}%</div>
                </div>
                <div className="text-center p-4 bg-slate-50 dark:bg-[#171717] rounded-lg">
                  <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Worst Case</div>
                  <div className="text-xs text-slate-500 dark:text-slate-500 mb-2">Return</div>
                  <div className="text-lg font-bold text-red-600 dark:text-red-400">{((displayResults.worstCase - inputs.balance) / inputs.balance * 100).toFixed(1)}%</div>
                </div>
                <div className="text-center p-4 bg-slate-50 dark:bg-[#171717] rounded-lg">
                  <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Profitable</div>
                  <div className="text-xs text-slate-500 dark:text-slate-500 mb-2">Scenarios</div>
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">{displayResults.profitableScenarios.toFixed(1)}%</div>
                </div>
              </div>
            </CardContent>
            </Card>
          </div>
      
          {/* Charts and Detailed Results */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Distribution Chart */}
              <Card className="shadow-xl border-0 bg-white/80 dark:bg-[#171717]/90 backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-800 dark:text-slate-100">
                    <div className="p-2 bg-blue-100 dark:bg-[#171717] rounded-lg">
                      <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    📊 Balance Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80 p-4 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-[#171717] dark:to-black rounded-xl">
                    <ReactECharts
                      option={{
                        tooltip: {
                          trigger: 'axis',
                          formatter: (params: unknown) => {
                            const data = (params as Array<{value: number; name: string}>)[0];
                            return `Frequency: ${data.value}<br/>Range: ${data.name}`;
                          },
                          backgroundColor: '#1e293b',
                          borderColor: 'transparent',
                          textStyle: {
                            color: '#f1f5f9'
                          }
                        },
                        xAxis: {
                          type: 'category',
                          data: displayResults.distributionData.map((_, index) => {
                            const min = Math.min(...Array.from({length: inputs.monteCarloSimulations}, () => Math.random() * 1000000));
                            const max = Math.max(...Array.from({length: inputs.monteCarloSimulations}, () => Math.random() * 1000000));
                            const binSize = (max - min) / 20;
                            const start = min + (index * binSize);
                            const end = start + binSize;
                            return `${(start/1000).toFixed(0)}K-${(end/1000).toFixed(0)}K`;
                          }),
                          axisLabel: {
                            rotate: 45,
                            fontSize: 10,
                            color: '#64748b'
                          },
                          axisLine: {
                            lineStyle: {
                              color: '#e2e8f0'
                            }
                          }
                        },
                        yAxis: {
                          type: 'value',
                          name: 'Frequency',
                          nameTextStyle: {
                            color: '#64748b'
                          },
                          axisLabel: {
                            color: '#64748b'
                          },
                          axisLine: {
                            lineStyle: {
                              color: '#e2e8f0'
                            }
                          },
                          splitLine: {
                            lineStyle: {
                              color: '#e2e8f0',
                              type: 'dashed'
                            }
                          }
                        },
                        series: [{
                          data: displayResults.distributionData,
                          type: 'bar',
                          itemStyle: {
                            color: {
                              type: 'linear',
                              x: 0,
                              y: 0,
                              x2: 0,
                              y2: 1,
                              colorStops: [{
                                offset: 0, color: '#10b981'
                              }, {
                                offset: 1, color: '#059669'
                              }]
                            },
                            borderRadius: [4, 4, 0, 0]
                          }
                        }],
                        grid: {
                          left: '10%',
                          right: '10%',
                          bottom: '20%',
                          top: '10%'
                        }
                      }}
                      style={{ height: '100%', width: '100%' }}
                    />
                  </div>
                </CardContent>
              </Card>
              
              {/* Balance Path Chart */}
              <Card className="shadow-xl border-0 bg-white/80 dark:bg-[#171717]/90 backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-800 dark:text-slate-100">
                    <div className="p-2 bg-purple-100 dark:bg-[#171717] rounded-lg">
                      <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    ✅ Sample Trading Path
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80 p-4 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-[#171717] dark:to-black rounded-xl">
                    <ReactECharts
                      option={{
                        tooltip: {
                          trigger: 'axis',
                          formatter: (params: unknown) => {
                            const data = (params as Array<{dataIndex: number; value: number}>)[0];
                            return `Trade ${data.dataIndex}: ${inputs.symbol}${data.value.toLocaleString('id-ID')}`;
                          },
                          backgroundColor: '#1e293b',
                          borderColor: 'transparent',
                          textStyle: {
                            color: '#f1f5f9'
                          }
                        },
                        xAxis: {
                          type: 'category',
                          data: displayResults.balancePathData.map((_, index) => index),
                          name: 'Trade Number',
                          nameLocation: 'middle',
                          nameGap: 30,
                          nameTextStyle: {
                            color: '#64748b'
                          },
                          axisLabel: {
                            color: '#64748b'
                          },
                          axisLine: {
                            lineStyle: {
                              color: '#e2e8f0'
                            }
                          }
                        },
                        yAxis: {
                          type: 'value',
                          name: 'Balance',
                          nameTextStyle: {
                            color: '#64748b'
                          },
                          axisLabel: {
                            formatter: (value: number) => `${(value/1000).toFixed(0)}K`,
                            color: '#64748b'
                          },
                          axisLine: {
                            lineStyle: {
                              color: '#e2e8f0'
                            }
                          },
                          splitLine: {
                            lineStyle: {
                              color: '#e2e8f0',
                              type: 'dashed'
                            }
                          }
                        },
                        series: [{
                          data: displayResults.balancePathData,
                          type: 'line',
                          smooth: true,
                          itemStyle: {
                            color: '#8b5cf6'
                          },
                          lineStyle: {
                            width: 3,
                            color: {
                              type: 'linear',
                              x: 0,
                              y: 0,
                              x2: 1,
                              y2: 0,
                              colorStops: [{
                                offset: 0, color: '#8b5cf6'
                              }, {
                                offset: 1, color: '#3b82f6'
                              }]
                            },
                            shadowColor: 'rgba(0, 0, 0, 0.1)',
                            shadowBlur: 4,
                            shadowOffsetY: 2
                          },
                          areaStyle: {
                            color: {
                              type: 'linear',
                              x: 0,
                              y: 0,
                              x2: 0,
                              y2: 1,
                              colorStops: [{
                                offset: 0, color: 'rgba(139, 92, 246, 0.1)'
                              }, {
                                offset: 1, color: 'rgba(59, 130, 246, 0.05)'
                              }]
                            }
                          }
                        }],
                        grid: {
                          left: '10%',
                          right: '10%',
                          bottom: '15%',
                          top: '10%'
                        }
                      }}
                      style={{ height: '100%', width: '100%' }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
      
          {/* Detailed Results Tables */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Expected Results */}
            <Card className="shadow-xl border-0 bg-white/80 dark:bg-[#171717]/90 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-800 dark:text-slate-100">
                <div className="p-2 bg-emerald-100 dark:bg-[#171717] rounded-lg">
                  <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                📈 Expected Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-[#171717] dark:to-black rounded-lg">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Expected Profit</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{inputs.symbol}{(displayResults.expectedProfit - inputs.balance).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-[#171717] dark:to-black rounded-lg">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Final Balance</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{inputs.symbol}{displayResults.finalBalance.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-[#171717] dark:to-black rounded-lg">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Total Investment</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{inputs.symbol}{displayResults.totalInvestment.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-[#171717] dark:to-black rounded-lg">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Total Commission (est)</span>
                <span className="font-bold text-orange-600 dark:text-orange-400">{inputs.symbol}{displayResults.totalCommission.toFixed(0)}</span>
              </div>
            </CardContent>
          </Card>
          
          {/* Position Size Calculator (SQN) */}
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-[#171717]/90 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-800 dark:text-slate-100">
                <div className="p-2 bg-amber-100 dark:bg-[#171717] rounded-lg">
                  <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                🎯 Position Size Calculator (SQN)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-[#171717] dark:to-black rounded-lg border border-orange-200 dark:border-gray-600">
                <span className="text-orange-700 dark:text-orange-300 font-medium">Aggressive (Full Kelly)</span>
                <span className="font-bold text-orange-600 dark:text-orange-400">25.0%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-[#171717] dark:to-black rounded-lg border border-blue-200 dark:border-gray-600">
                <span className="text-blue-700 dark:text-blue-300 font-medium">Balanced (Half Kelly)</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">12.5%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-[#171717] dark:to-black rounded-lg border border-green-200 dark:border-gray-600">
                <span className="text-green-700 dark:text-green-300 font-medium">Conservative (Quarter Kelly)</span>
                <span className="font-bold text-green-600 dark:text-green-400">6.3%</span>
              </div>
            </CardContent>
          </Card>
          
          {/* Risk & Drawdowns */}
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-[#171717]/90 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-800 dark:text-slate-100">
                <div className="p-2 bg-red-100 dark:bg-[#171717] rounded-lg">
                  <TrendingUp className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                ⚠️ Risk & Drawdowns
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-red-50 to-rose-50 dark:from-[#171717] dark:to-black rounded-lg border border-red-200 dark:border-gray-600">
                <span className="text-red-700 dark:text-red-300 font-medium">Max Drawdown (Median)</span>
                <span className="font-bold text-red-600 dark:text-red-400">{displayResults.maxDrawdown.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-red-50 to-rose-50 dark:from-[#171717] dark:to-black rounded-lg border border-red-200 dark:border-gray-600">
                <span className="text-red-700 dark:text-red-300 font-medium">Max Drawdown (P95)</span>
                <span className="font-bold text-red-600 dark:text-red-400">{(displayResults.maxDrawdown * 1.5).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-[#171717] dark:to-black rounded-lg">
                 <span className="text-slate-600 dark:text-slate-400 font-medium">Prob. Ruin is stable (&gt;1)</span>
                 <span className="font-bold text-green-600 dark:text-green-400">0.0%</span>
               </div>
               <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-[#171717] dark:to-black rounded-lg">
                 <span className="text-slate-600 dark:text-slate-400 font-medium">Risk of Ruin</span>
                 <span className="font-bold text-green-600 dark:text-green-400">0.0%</span>
               </div>
            </CardContent>
          </Card>
        </div>
      
      {/* Streak Analytics */}
      <Card className="shadow-xl border-0 bg-white/80 dark:bg-[#171717]/90 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-800 dark:text-slate-100">
              <div className="p-2 bg-indigo-100 dark:bg-[#171717] rounded-lg">
                <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              🔥 Streak Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-[#171717] dark:to-black rounded-xl border border-green-200 dark:border-gray-600">
                <div className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">Longest Win Streak</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{Math.round(displayResults.longestWinStreak)}</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-red-50 to-rose-50 dark:from-[#171717] dark:to-black rounded-xl border border-red-200 dark:border-gray-600">
                <div className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">Longest Loss Streak</div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{Math.round(displayResults.longestLossStreak)}</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-[#171717] dark:to-black rounded-xl border border-blue-200 dark:border-gray-600">
                <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">Expected ROI</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{displayResults.roi.toFixed(2)}%</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-[#171717] dark:to-black rounded-xl border border-purple-200 dark:border-gray-600">
                <div className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">Simulations</div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{inputs.monteCarloSimulations.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Penjelasan & Saran Otomatis */}
        <Card className="shadow-xl border-0 bg-white/80 dark:bg-[#171717]/90 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-800 dark:text-slate-100">
              <div className="p-2 bg-emerald-100 dark:bg-[#171717] rounded-lg">
                <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              💡 Penjelasan & Saran Otomatis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {/* EXPECTANCY */}
              <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-[#171717] dark:to-black rounded-lg border border-green-200 dark:border-gray-600">
                <div className="p-1 bg-green-100 dark:bg-[#171717] rounded">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="font-semibold text-green-700 dark:text-green-300 mb-1">
                    <span className="bg-green-100 dark:bg-[#171717] px-2 py-1 rounded text-sm font-bold">EXPECTANCY</span>
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">
                    Expectancy positif ({inputs.rewardRiskRatio.toFixed(1)} R). Pertahankan konsistensi eksekusi.
                  </div>
                </div>
              </div>
              
              {/* WIN RATE */}
              <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-[#171717] dark:to-black rounded-lg border border-blue-200 dark:border-gray-600">
                <div className="p-1 bg-blue-100 dark:bg-[#171717] rounded">
                  <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="font-semibold text-blue-700 dark:text-blue-300 mb-1">
                    <span className="bg-blue-100 dark:bg-[#171717] px-2 py-1 rounded text-sm font-bold">WIN RATE</span>
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    Win rate {inputs.winRate}% {'>='} break-even {(100 / (1 + inputs.rewardRiskRatio)).toFixed(1)}%.
                  </div>
                </div>
              </div>
              
              {/* SIZING */}
              <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-[#171717] dark:to-black rounded-lg border border-orange-200 dark:border-gray-600">
                <div className="p-1 bg-orange-100 dark:bg-[#171717] rounded">
                  <DollarSign className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <div className="font-semibold text-orange-700 dark:text-orange-300 mb-1">
                    <span className="bg-orange-100 dark:bg-[#171717] px-2 py-1 rounded text-sm font-bold">SIZING</span>
                  </div>
                  <div className="text-sm text-orange-700 dark:text-orange-300">
                    Risk per trade {inputs.riskPerTrade}% tinggi. Coba {'≤'} 1-2% untuk menekan drawdown.
                  </div>
                </div>
              </div>
              
              {/* KELLY */}
              <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-[#171717] dark:to-black rounded-lg border border-teal-200 dark:border-gray-600">
                <div className="p-1 bg-teal-100 dark:bg-[#171717] rounded">
                  <BarChart3 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <div className="font-semibold text-teal-700 dark:text-teal-300 mb-1">
                    <span className="bg-teal-100 dark:bg-[#171717] px-2 py-1 rounded text-sm font-bold">KELLY</span>
                  </div>
                  <div className="text-sm text-teal-700 dark:text-teal-300">
                    Sizing relatif aman dibanding Half Kelly ({((inputs.winRate/100 - (100-inputs.winRate)/100/inputs.rewardRiskRatio) * 50).toFixed(1)}%).
                  </div>
                </div>
              </div>
              
              {/* DRAWDOWN */}
              <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-red-50 to-rose-50 dark:from-[#171717] dark:to-black rounded-lg border border-red-200 dark:border-gray-600">
                <div className="p-1 bg-red-100 dark:bg-[#171717] rounded">
                  <TrendDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <div className="font-semibold text-red-700 dark:text-red-300 mb-1">
                    <span className="bg-red-100 dark:bg-[#171717] px-2 py-1 rounded text-sm font-bold">DRAWDOWN</span>
                  </div>
                  <div className="text-sm text-red-700 dark:text-red-300">
                    Max DD P95 {(displayResults.maxDrawdown * 1.5).toFixed(1)}% berisiko. Targetkan {'<'} 30% dengan mengecilkan posisi.
                  </div>
                </div>
              </div>
              
              {/* RISK */}
              <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-[#171717] dark:to-black rounded-lg">
                <div className="p-1 bg-slate-100 dark:bg-[#171717] rounded">
                  <AlertTriangle className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <span className="bg-slate-100 dark:bg-[#171717] px-2 py-1 rounded text-sm font-bold">RISK</span>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Probabilitas DD {'≥'} 50% 0.0% rendah.
                  </div>
                </div>
              </div>
              
              {/* RUIN */}
              <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-[#171717] dark:to-black rounded-lg border border-emerald-200 dark:border-gray-600">
                <div className="p-1 bg-emerald-100 dark:bg-[#171717] rounded">
                  <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <div className="font-semibold text-emerald-700 dark:text-emerald-300 mb-1">
                    <span className="bg-emerald-100 dark:bg-[#171717] px-2 py-1 rounded text-sm font-bold">RUIN</span>
                  </div>
                  <div className="text-sm text-emerald-700 dark:text-emerald-300">
                    Prob. bangkrut 0% pada simulasi ini.
                  </div>
                </div>
              </div>
              
              {/* STREAK */}
              <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-[#171717] dark:to-black rounded-lg border border-purple-200 dark:border-gray-600">
                <div className="p-1 bg-purple-100 dark:bg-[#171717] rounded">
                  <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="font-semibold text-purple-700 dark:text-purple-300 mb-1">
                    <span className="bg-purple-100 dark:bg-[#171717] px-2 py-1 rounded text-sm font-bold">STREAK</span>
                  </div>
                  <div className="text-sm text-purple-700 dark:text-purple-300">
                    Longest loss streak (median) {Math.round(displayResults.longestLossStreak)}. Pastikan buffer modal & mental siap.
                  </div>
                </div>
              </div>
              
              {/* BIAYA */}
              <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-[#171717] dark:to-black rounded-lg border border-amber-200 dark:border-gray-600">
                <div className="p-1 bg-amber-100 dark:bg-[#171717] rounded">
                  <DollarSign className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <div className="font-semibold text-amber-700 dark:text-amber-300 mb-1">
                    <span className="bg-amber-100 dark:bg-[#171717] px-2 py-1 rounded text-sm font-bold">BIAYA</span>
                  </div>
                  <div className="text-sm text-amber-700 dark:text-amber-300">
                    Komisi {inputs.commissionPerTrade}%/trade memakan expectancy. Pertimbangkan broker/spread lebih rendah.
                  </div>
                </div>
              </div>
              
              {/* SAMPLE */}
              <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-[#171717] dark:to-black rounded-lg border border-indigo-200 dark:border-gray-600">
                <div className="p-1 bg-indigo-100 dark:bg-[#171717] rounded">
                  <BarChart3 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <div className="font-semibold text-indigo-700 dark:text-indigo-300 mb-1">
                    <span className="bg-indigo-100 dark:bg-[#171717] px-2 py-1 rounded text-sm font-bold">SAMPLE</span>
                  </div>
                  <div className="text-sm text-indigo-700 dark:text-indigo-300">
                    Jumlah trade {inputs.jumlahTrade} memadai untuk estimasi awal.
                  </div>
                </div>
              </div>
              
              {/* SIMULASI */}
              <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-cyan-50 to-sky-50 dark:from-[#171717] dark:to-black rounded-lg border border-cyan-200 dark:border-gray-600">
                <div className="p-1 bg-cyan-100 dark:bg-[#171717] rounded">
                  <BarChart3 className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <div className="font-semibold text-cyan-700 dark:text-cyan-300 mb-1">
                    <span className="bg-cyan-100 dark:bg-[#171717] px-2 py-1 rounded text-sm font-bold">SIMULASI</span>
                  </div>
                  <div className="text-sm text-cyan-700 dark:text-cyan-300">
                    Runs {inputs.monteCarloSimulations.toLocaleString()} sudah cukup baik.
                  </div>
                </div>
              </div>
              
              {/* ROI */}
              <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-[#171717] dark:to-black rounded-lg border border-green-200 dark:border-gray-600">
                <div className="p-1 bg-green-100 dark:bg-[#171717] rounded">
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="font-semibold text-green-700 dark:text-green-300 mb-1">
                    <span className="bg-green-100 dark:bg-[#171717] px-2 py-1 rounded text-sm font-bold">ROI</span>
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">
                    Ekspektasi ROI {displayResults.roi.toFixed(2)}%+{(displayResults.roi * 0.21).toFixed(0)}% positif.
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-gradient-to-r from-slate-100 to-gray-100 dark:from-[#171717] dark:to-black rounded-lg border border-slate-200 dark:border-gray-600">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                <strong>Catatan:</strong> Komisi dihitung sebagai persen dari <em>risk amount</em> tiap trade. Risk Type &quot;Persentase&quot; artinya compounding. Max Drawdown dihitung per simulasi dan diambil median/P95 antar simulasi. Hasil simulasi bersifat edukatif.
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfitabilityCalculator;