'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { TrendingUp, TrendingDown, Calculator, AlertTriangle, Target, BarChart3, Clock } from 'lucide-react';
import { trackToolAccess, trackToolUsage } from '@/lib/analytics';

// Timeframe types
type Timeframe = 'daily' | 'weekly' | 'monthly';

const TIMEFRAME_CONFIG = {
  daily: {
    label: 'Daily (1D)',
    previousLabel: 'Data Hari Sebelumnya',
    currentLabel: 'Data Hari Ini',
    detectionMultiplier: 0.15,
    riskMultiplier: 0.2, // 20% dari range untuk stoploss (jarak terkecil)
    targetMultiplier: 2.0, // 2x risk untuk target (risk/reward 1:2)
    validityUnits: {
      short: 'jam',
      medium: 'jam', 
      long: 'hari'
    }
  },
  weekly: {
    label: 'Weekly (1W)',
    previousLabel: 'Data Minggu Sebelumnya',
    currentLabel: 'Data Minggu Ini',
    detectionMultiplier: 0.08,
    riskMultiplier: 0.35, // 35% dari range untuk stoploss (jarak menengah)
    targetMultiplier: 1.8, // 1.8x risk untuk target (risk/reward 1:1.8)
    validityUnits: {
      short: 'hari',
      medium: 'hari',
      long: 'minggu'
    }
  },
  monthly: {
    label: 'Monthly (1M)',
    previousLabel: 'Data Bulan Sebelumnya', 
    currentLabel: 'Data Bulan Ini',
    detectionMultiplier: 0.05,
    riskMultiplier: 0.5, // 50% dari range untuk stoploss (jarak terbesar)
    targetMultiplier: 1.5, // 1.5x risk untuk target (risk/reward 1:1.5)
    validityUnits: {
      short: 'minggu',
      medium: 'minggu',
      long: 'bulan'
    }
  }
};

// Types for Elliott Wave data
interface PreviousDayData {
  high: number;
  low: number;
  close: number;
}

interface TodayData {
  openOrWAP: number;
}

interface ElliotWaveResults {
  wave1: number;
  wave2: number;
  wave3: number;
  wave4: number;
  wave5: number;
  waveA: number;
  waveB: number;
  waveC: number;
  recommendations: {
    buySignals: Array<{
      level: number;
      target: number;
      stoploss: number;
      validity: string;
      description: string;
      probability?: {
        type: 'sell_at' | 'sell_below';
        level: number;
        description: string;
      };
    }>;
    sellSignals: Array<{
      level: number;
      target: number;
      stoploss: number;
      validity: string;
      description: string;
      probability?: {
        type: 'buy_at' | 'buy_above';
        level: number;
        description: string;
      };
    }>;
  };
}

interface FormData {
  timeframe: Timeframe;
  previousHigh: string;
  previousLow: string;
  previousClose: string;
  todayOpenWAP: string;
}

interface FormErrors {
  [key: string]: string;
}

const ElliotWaveCalculator: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    timeframe: 'daily',
    previousHigh: '',
    previousLow: '',
    previousClose: '',
    todayOpenWAP: ''
  });
  
  const [results, setResults] = useState<ElliotWaveResults | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isCalculating, setIsCalculating] = useState(false);

  // Track tool access when component mounts
  useEffect(() => {
    trackToolAccess('Elliott Wave Calculator', 'calculator');
  }, []);

  // Input validation and sanitization
  const validateAndSanitizeInput = useCallback((value: string): number | null => {
    // Remove any non-numeric characters except decimal point
    const sanitized = value.replace(/[^0-9.-]/g, '');
    
    // Check if it's a valid number
    const num = parseFloat(sanitized);
    
    if (isNaN(num) || !isFinite(num)) {
      return null;
    }
    
    // Reasonable bounds for price data (0.001 to 1,000,000)
    if (num < 0.001 || num > 1000000) {
      return null;
    }
    
    return Math.round(num * 100000) / 100000; // Round to 5 decimal places
  }, []);

  // Validate form data
  const validateForm = useCallback((data: FormData): { isValid: boolean; errors: FormErrors } => {
    const newErrors: FormErrors = {};
    
    const previousHigh = validateAndSanitizeInput(data.previousHigh);
    const previousLow = validateAndSanitizeInput(data.previousLow);
    const previousClose = validateAndSanitizeInput(data.previousClose);
    const todayOpenWAP = validateAndSanitizeInput(data.todayOpenWAP);
    
    if (previousHigh === null) {
      newErrors.previousHigh = 'High harus berupa angka yang valid';
    }
    
    if (previousLow === null) {
      newErrors.previousLow = 'Low harus berupa angka yang valid';
    }
    
    if (previousClose === null) {
      newErrors.previousClose = 'Close harus berupa angka yang valid';
    }
    
    if (todayOpenWAP === null) {
      newErrors.todayOpenWAP = 'Open/WAP harus berupa angka yang valid';
    }
    
    // Logical validation
    if (previousHigh !== null && previousLow !== null && previousHigh <= previousLow) {
      newErrors.previousHigh = 'High harus lebih besar dari Low';
    }
    
    if (previousHigh !== null && previousClose !== null && previousClose > previousHigh) {
      newErrors.previousClose = 'Close tidak boleh lebih besar dari High';
    }
    
    if (previousLow !== null && previousClose !== null && previousClose < previousLow) {
      newErrors.previousClose = 'Close tidak boleh lebih kecil dari Low';
    }
    
    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors
    };
  }, [validateAndSanitizeInput]);

  // Calculate Elliott Wave levels
  const calculateElliotWave = useCallback((previousDay: PreviousDayData, today: TodayData): ElliotWaveResults => {
    const { high, low, close } = previousDay;
    const { openOrWAP } = today;
    
    // Calculate pivot point
    const pivotPoint = (high + low + close) / 3;
    
    // Calculate Elliott Wave levels using Fibonacci ratios
    const range = high - low;
    
    // Wave calculations based on Elliott Wave theory
    const wave1 = pivotPoint + (range * 0.236); // 23.6% Fibonacci
    const wave2 = pivotPoint - (range * 0.236);
    const wave3 = pivotPoint + (range * 0.618); // 61.8% Fibonacci (Golden Ratio)
    const wave4 = pivotPoint - (range * 0.382); // 38.2% Fibonacci
    const wave5 = pivotPoint + (range * 1.000); // 100% extension
    
    // Corrective waves (A, B, C)
    const waveA = pivotPoint + (range * 0.382);
    const waveB = pivotPoint - (range * 0.618);
    const waveC = pivotPoint - (range * 1.000);
    
    // Generate recommendations based on current price position
    const buySignals: Array<{
      level: number;
      target: number;
      stoploss: number;
      validity: string;
      description: string;
      probability?: {
        type: 'sell_at' | 'sell_below';
        level: number;
        description: string;
      };
    }> = [];
    const sellSignals: Array<{
      level: number;
      target: number;
      stoploss: number;
      validity: string;
      description: string;
      probability?: {
        type: 'buy_at' | 'buy_above';
        level: number;
        description: string;
      };
    }> = [];
    
    // Calculate additional support and resistance levels
    const pivotSupport1 = pivotPoint - (range * 0.1); // 10% below pivot
    const pivotSupport2 = pivotPoint - (range * 0.2); // 20% below pivot
    const pivotResistance1 = pivotPoint + (range * 0.1); // 10% above pivot
    const pivotResistance2 = pivotPoint + (range * 0.2); // 20% above pivot
    
    // Detection range for signals based on timeframe
    const config = TIMEFRAME_CONFIG[formData.timeframe];
    const detectionRange = range * config.detectionMultiplier;
    
    // Buy signals - Risk/Reward optimized berdasarkan timeframe
    
    // Scenario 1: Buy at Wave 2 support
     if (openOrWAP <= wave2 + detectionRange) {
       const stopDistance = range * config.riskMultiplier; // Stoploss berdasarkan timeframe
       const targetDistance = stopDistance * config.targetMultiplier; // Target berdasarkan timeframe
       buySignals.push({
         level: wave2,
         target: wave2 + targetDistance,
         stoploss: wave2 - stopDistance,
         validity: `Valid untuk 4 ${config.validityUnits.short} pertama trading`,
         description: 'Buy di level Wave 2 support',
         probability: {
           type: 'sell_below',
           level: wave2 - (stopDistance * 0.5),
           description: `Sell below ${Math.round((wave2 - (stopDistance * 0.5)) * 100) / 100} jika breakout gagal`
         }
       });
     }
     
     // Scenario 2: Buy at Wave 4 support
     if (openOrWAP <= wave4 + detectionRange) {
       const stopDistance = range * config.riskMultiplier;
       const targetDistance = stopDistance * config.targetMultiplier;
       buySignals.push({
         level: wave4,
         target: wave4 + targetDistance,
         stoploss: wave4 - stopDistance,
         validity: `Valid sepanjang ${config.validityUnits.long} trading`,
         description: 'Buy di level Wave 4 support',
         probability: {
           type: 'sell_at',
           level: wave3,
           description: `Sell at ${Math.round(wave3 * 100) / 100} untuk profit taking`
         }
       });
     }
     
     // Scenario 3: Buy at Wave B support
     if (openOrWAP <= waveB + detectionRange) {
       const stopDistance = range * config.riskMultiplier;
       const targetDistance = stopDistance * config.targetMultiplier;
       buySignals.push({
         level: waveB,
         target: waveB + targetDistance,
         stoploss: waveB - stopDistance,
         validity: `Valid sepanjang ${config.validityUnits.long} trading`,
         description: 'Buy di level Wave B support',
         probability: {
           type: 'sell_at',
           level: waveA,
           description: `Sell at ${Math.round(waveA * 100) / 100} resistance level`
         }
       });
     }
     
     // Scenario 4: Buy at Pivot Support levels
     if (openOrWAP <= pivotSupport1 + detectionRange) {
       const stopDistance = range * config.riskMultiplier;
       const targetDistance = stopDistance * config.targetMultiplier;
       buySignals.push({
         level: pivotSupport1,
         target: pivotSupport1 + targetDistance,
         stoploss: pivotSupport1 - stopDistance,
         validity: `Valid untuk 6 ${config.validityUnits.medium} trading`,
         description: 'Buy di level Pivot Support 1',
         probability: {
           type: 'sell_at',
           level: pivotResistance1,
           description: `Sell at ${Math.round(pivotResistance1 * 100) / 100} pivot resistance`
         }
       });
     }
     
     if (openOrWAP <= pivotSupport2 + detectionRange) {
       const stopDistance = range * config.riskMultiplier;
       const targetDistance = stopDistance * config.targetMultiplier;
       buySignals.push({
         level: pivotSupport2,
         target: pivotSupport2 + targetDistance,
         stoploss: pivotSupport2 - stopDistance,
         validity: `Valid sepanjang ${config.validityUnits.long}`,
         description: 'Buy di level Pivot Support 2 (Strong Support)',
         probability: {
           type: 'sell_at',
           level: pivotResistance2,
           description: `Sell at ${Math.round(pivotResistance2 * 100) / 100} strong resistance`
         }
       });
     }
     
     // Scenario 5: Conservative buy near current price
     if (openOrWAP >= pivotPoint - detectionRange && openOrWAP <= pivotPoint + detectionRange) {
       const stopDistance = range * (config.riskMultiplier * 0.75); // Lebih konservatif
       const targetDistance = stopDistance * config.targetMultiplier;
       buySignals.push({
         level: openOrWAP,
         target: openOrWAP + targetDistance,
         stoploss: openOrWAP - stopDistance,
         validity: `Valid untuk 2 ${config.validityUnits.short} pertama`,
         description: 'Conservative buy near pivot point',
         probability: {
           type: 'sell_below',
           level: pivotPoint - (stopDistance * 0.3),
           description: `Sell below ${Math.round((pivotPoint - (stopDistance * 0.3)) * 100) / 100} jika trend berubah`
         }
       });
     }
    
    // Sell signals - Risk/Reward optimized berdasarkan timeframe
    
    // Scenario 1: Sell at Wave 1 resistance
     if (openOrWAP >= wave1 - detectionRange) {
       const stopDistance = range * config.riskMultiplier;
       const targetDistance = stopDistance * config.targetMultiplier;
       sellSignals.push({
         level: wave1,
         target: wave1 - targetDistance,
         stoploss: wave1 + stopDistance,
         validity: `Valid jika breakout terkonfirmasi dalam ${config.validityUnits.short}`,
         description: 'Sell di level Wave 1 resistance',
         probability: {
           type: 'buy_above',
           level: wave1 + (stopDistance * 0.5),
           description: `Buy above ${Math.round((wave1 + (stopDistance * 0.5)) * 100) / 100} jika breakout kuat`
         }
       });
     }
     
     // Scenario 2: Sell at Wave 3 resistance
     if (openOrWAP >= wave3 - detectionRange) {
       const stopDistance = range * config.riskMultiplier;
       const targetDistance = stopDistance * config.targetMultiplier;
       sellSignals.push({
         level: wave3,
         target: wave3 - targetDistance,
         stoploss: wave3 + stopDistance,
         validity: `Valid jika momentum bearish kuat dalam ${config.validityUnits.short}`,
         description: 'Sell di level Wave 3 resistance',
         probability: {
           type: 'buy_at',
           level: wave2,
           description: `Buy at ${Math.round(wave2 * 100) / 100} support untuk rebound`
         }
       });
     }
     
     // Scenario 3: Sell at Wave A resistance
     if (openOrWAP >= waveA - detectionRange) {
       const stopDistance = range * config.riskMultiplier;
       const targetDistance = stopDistance * config.targetMultiplier;
       sellSignals.push({
         level: waveA,
         target: waveA - targetDistance,
         stoploss: waveA + stopDistance,
         validity: `Valid sepanjang ${config.validityUnits.long} trading`,
         description: 'Sell di level Wave A resistance',
         probability: {
           type: 'buy_at',
           level: waveB,
           description: `Buy at ${Math.round(waveB * 100) / 100} Wave B support`
         }
       });
     }
     
     // Scenario 4: Sell at Pivot Resistance levels
     if (openOrWAP >= pivotResistance1 - detectionRange) {
       const stopDistance = range * config.riskMultiplier;
       const targetDistance = stopDistance * config.targetMultiplier;
       sellSignals.push({
         level: pivotResistance1,
         target: pivotResistance1 - targetDistance,
         stoploss: pivotResistance1 + stopDistance,
         validity: `Valid untuk 6 ${config.validityUnits.medium} trading`,
         description: 'Sell di level Pivot Resistance 1',
         probability: {
           type: 'buy_at',
           level: pivotSupport1,
           description: `Buy at ${Math.round(pivotSupport1 * 100) / 100} pivot support`
         }
       });
     }
     
     if (openOrWAP >= pivotResistance2 - detectionRange) {
       const stopDistance = range * config.riskMultiplier;
       const targetDistance = stopDistance * config.targetMultiplier;
       sellSignals.push({
         level: pivotResistance2,
         target: pivotResistance2 - targetDistance,
         stoploss: pivotResistance2 + stopDistance,
         validity: `Valid sepanjang ${config.validityUnits.long}`,
         description: 'Sell di level Pivot Resistance 2 (Strong Resistance)',
         probability: {
           type: 'buy_at',
           level: pivotSupport2,
           description: `Buy at ${Math.round(pivotSupport2 * 100) / 100} strong support`
         }
       });
     }
     
     // Scenario 5: Conservative sell near current price
     if (openOrWAP >= pivotPoint - detectionRange && openOrWAP <= pivotPoint + detectionRange) {
       const stopDistance = range * (config.riskMultiplier * 0.75); // Lebih konservatif
       const targetDistance = stopDistance * config.targetMultiplier;
       sellSignals.push({
         level: openOrWAP,
         target: openOrWAP - targetDistance,
         stoploss: openOrWAP + stopDistance,
         validity: `Valid untuk 2 ${config.validityUnits.short} pertama`,
         description: 'Conservative sell near pivot point',
         probability: {
           type: 'buy_above',
           level: pivotPoint + (stopDistance * 0.3),
           description: `Buy above ${Math.round((pivotPoint + (stopDistance * 0.3)) * 100) / 100} jika trend naik`
         }
       });
     }
    
    return {
      wave1: Math.round(wave1 * 100) / 100,
      wave2: Math.round(wave2 * 100) / 100,
      wave3: Math.round(wave3 * 100) / 100,
      wave4: Math.round(wave4 * 100) / 100,
      wave5: Math.round(wave5 * 100) / 100,
      waveA: Math.round(waveA * 100) / 100,
      waveB: Math.round(waveB * 100) / 100,
      waveC: Math.round(waveC * 100) / 100,
      recommendations: {
        buySignals,
        sellSignals
      }
    };
  }, [formData.timeframe]);

  // Handle input changes
  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // Handle form submission
  const handleCalculate = useCallback(async () => {
    setIsCalculating(true);
    
    try {
      const validation = validateForm(formData);
      
      if (!validation.isValid) {
        setErrors(validation.errors);
        setResults(null);
        return;
      }
      
      const previousDay: PreviousDayData = {
        high: validateAndSanitizeInput(formData.previousHigh)!,
        low: validateAndSanitizeInput(formData.previousLow)!,
        close: validateAndSanitizeInput(formData.previousClose)!
      };
      
      const today: TodayData = {
        openOrWAP: validateAndSanitizeInput(formData.todayOpenWAP)!
      };
      
      const elliotResults = calculateElliotWave(previousDay, today);
      setResults(elliotResults);
      setErrors({});
      
      // Track successful calculation
      trackToolUsage({
        toolName: 'Elliott Wave Calculator',
        toolType: 'calculation_completed',
        usageData: {
          inputParams: {
            timeframe: formData.timeframe,
            buySignalsCount: elliotResults.recommendations.buySignals.length,
            sellSignalsCount: elliotResults.recommendations.sellSignals.length
          },
          success: true
        }
      });
      
    } catch {
      setErrors({ general: 'Terjadi kesalahan dalam perhitungan' });
      setResults(null);
    } finally {
      setIsCalculating(false);
    }
  }, [formData, validateForm, validateAndSanitizeInput, calculateElliotWave]);

  // Reset form
  const handleReset = useCallback(() => {
    setFormData({
      timeframe: 'daily',
      previousHigh: '',
      previousLow: '',
      previousClose: '',
      todayOpenWAP: ''
    });
    setResults(null);
    setErrors({});
  }, []);

  return (
    <div className="space-y-8">
      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Elliott Wave Calculator
          </CardTitle>
          <CardDescription>
            Masukkan data OHLC untuk menghitung level Elliott Wave dan mendapatkan rekomendasi trading. Pilih timeframe sesuai analisis Anda (Daily, Weekly, atau Monthly).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Timeframe Selector */}
          <div className="mb-6">
            <Label htmlFor="timeframe" className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4" />
              Timeframe
            </Label>
            <Select value={formData.timeframe} onValueChange={(value: Timeframe) => handleInputChange('timeframe', value)}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Pilih timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">{TIMEFRAME_CONFIG.daily.label}</SelectItem>
                <SelectItem value="weekly">{TIMEFRAME_CONFIG.weekly.label}</SelectItem>
                <SelectItem value="monthly">{TIMEFRAME_CONFIG.monthly.label}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Previous Period Data */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                {TIMEFRAME_CONFIG[formData.timeframe].previousLabel}
              </h3>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="previousHigh">High</Label>
                  <Input
                    id="previousHigh"
                    type="text"
                    placeholder="Masukkan harga tertinggi"
                    value={formData.previousHigh}
                    onChange={(e) => handleInputChange('previousHigh', e.target.value)}
                    className={errors.previousHigh ? 'border-destructive' : ''}
                  />
                  {errors.previousHigh && (
                    <p className="text-sm text-destructive mt-1">{errors.previousHigh}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="previousLow">Low</Label>
                  <Input
                    id="previousLow"
                    type="text"
                    placeholder="Masukkan harga terendah"
                    value={formData.previousLow}
                    onChange={(e) => handleInputChange('previousLow', e.target.value)}
                    className={errors.previousLow ? 'border-destructive' : ''}
                  />
                  {errors.previousLow && (
                    <p className="text-sm text-destructive mt-1">{errors.previousLow}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="previousClose">Close</Label>
                  <Input
                    id="previousClose"
                    type="text"
                    placeholder="Masukkan harga penutupan"
                    value={formData.previousClose}
                    onChange={(e) => handleInputChange('previousClose', e.target.value)}
                    className={errors.previousClose ? 'border-destructive' : ''}
                  />
                  {errors.previousClose && (
                    <p className="text-sm text-destructive mt-1">{errors.previousClose}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Current Period Data */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                {TIMEFRAME_CONFIG[formData.timeframe].currentLabel}
              </h3>
              
              <div>
                <Label htmlFor="todayOpenWAP">Open / WAP (Average)</Label>
                <Input
                  id="todayOpenWAP"
                  type="text"
                  placeholder="Masukkan harga pembukaan atau rata-rata"
                  value={formData.todayOpenWAP}
                  onChange={(e) => handleInputChange('todayOpenWAP', e.target.value)}
                  className={errors.todayOpenWAP ? 'border-destructive' : ''}
                />
                {errors.todayOpenWAP && (
                  <p className="text-sm text-destructive mt-1">{errors.todayOpenWAP}</p>
                )}
              </div>
              
              <div className="pt-4">
                <div className="flex gap-3">
                  <Button 
                    onClick={handleCalculate} 
                    disabled={isCalculating}
                    className="flex-1"
                  >
                    {isCalculating ? 'Menghitung...' : 'Find Values'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleReset}
                    disabled={isCalculating}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* General Error */}
          {errors.general && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{errors.general}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Elliott Wave Levels */}
          <Card>
            <CardHeader>
              <CardTitle>Elliott Wave Levels</CardTitle>
              <CardDescription>
                Level-level Elliott Wave berdasarkan perhitungan Fibonacci
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Impulse Waves */}
                <div>
                  <h4 className="font-medium text-foreground mb-3">Impulse Waves (1-5)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm font-medium">Wave 1</span>
                      <Badge variant="secondary">{results.wave1.toFixed(5)}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm font-medium">Wave 2</span>
                      <Badge variant="secondary">{results.wave2.toFixed(5)}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm font-medium">Wave 3</span>
                      <Badge variant="secondary">{results.wave3.toFixed(5)}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm font-medium">Wave 4</span>
                      <Badge variant="secondary">{results.wave4.toFixed(5)}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted rounded col-span-2">
                      <span className="text-sm font-medium">Wave 5</span>
                      <Badge variant="secondary">{results.wave5.toFixed(5)}</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-border my-4" />
                
                {/* Corrective Waves */}
                <div>
                  <h4 className="font-medium text-foreground mb-3">Corrective Waves (A-C)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm font-medium">Wave A</span>
                      <Badge variant="outline">{results.waveA.toFixed(5)}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm font-medium">Wave B</span>
                      <Badge variant="outline">{results.waveB.toFixed(5)}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted rounded col-span-2">
                      <span className="text-sm font-medium">Wave C</span>
                      <Badge variant="outline">{results.waveC.toFixed(5)}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Trading Recommendations</CardTitle>
              <CardDescription>
                Rekomendasi buy/sell berdasarkan analisis Elliott Wave
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Buy Signals */}
                {results.recommendations.buySignals.length > 0 && (
                  <div>
                    <h4 className="font-medium text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Buy Signals
                    </h4>
                    <div className="space-y-3">
                      {results.recommendations.buySignals.map((signal, index) => (
                        <div key={index} className="p-4 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-950">
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-sm font-medium text-green-800 dark:text-white">
                              {signal.description}
                            </span>
                            <Badge className="bg-green-600 hover:bg-green-700 text-white">
                              Buy @ {signal.level.toFixed(5)}
                            </Badge>
                          </div>
                          <div className="text-xs text-green-700 dark:text-white space-y-1 mb-3">
                            <div>Target: {signal.target.toFixed(5)} | Stoploss: {signal.stoploss.toFixed(5)}</div>
                            <div className="italic">{signal.validity}</div>
                          </div>
                          {signal.probability && (
                            <div className="mt-3 pt-3 border-t border-green-300 dark:border-green-700">
                              <div className="flex items-center gap-2 text-xs">
                                <AlertTriangle className="h-3 w-3 text-orange-500" />
                                <span className="font-medium text-orange-700 dark:text-orange-300">Alternative Signal:</span>
                              </div>
                              <div className="text-xs text-orange-600 dark:text-orange-400 mt-1 ml-5">
                                {signal.probability.description}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Sell Signals */}
                {results.recommendations.sellSignals.length > 0 && (
                  <div>
                    <h4 className="font-medium text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
                      <TrendingDown className="h-4 w-4" />
                      Sell Signals
                    </h4>
                    <div className="space-y-3">
                      {results.recommendations.sellSignals.map((signal, index) => (
                        <div key={index} className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-950">
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-sm font-medium text-red-800 dark:text-white">
                              {signal.description}
                            </span>
                            <Badge variant="destructive" className="text-white">
                              Sell @ {signal.level.toFixed(5)}
                            </Badge>
                          </div>
                          <div className="text-xs text-red-700 dark:text-white space-y-1 mb-3">
                            <div>Target: {signal.target.toFixed(5)} | Stoploss: {signal.stoploss.toFixed(5)}</div>
                            <div className="italic">{signal.validity}</div>
                          </div>
                          {signal.probability && (
                            <div className="mt-3 pt-3 border-t border-red-300 dark:border-red-700">
                              <div className="flex items-center gap-2 text-xs">
                                <AlertTriangle className="h-3 w-3 text-blue-500" />
                                <span className="font-medium text-blue-700 dark:text-blue-300">Alternative Signal:</span>
                              </div>
                              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 ml-5">
                                {signal.probability.description}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* No Signals */}
                {results.recommendations.buySignals.length === 0 && results.recommendations.sellSignals.length === 0 && (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Tidak ada sinyal trading yang terdeteksi pada level harga saat ini.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Tunggu harga mendekati level support atau resistance untuk mendapatkan sinyal.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ElliotWaveCalculator;