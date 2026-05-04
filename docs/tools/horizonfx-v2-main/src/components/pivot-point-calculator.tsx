'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Calculator, TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle } from 'lucide-react';
import { trackToolAccess, trackToolUsage } from '@/lib/analytics';

interface OHLCData {
  open: string;
  high: string;
  low: string;
  close: string;
}

interface PivotResults {
  pivotPoint: number;
  resistance1: number;
  resistance2: number;
  resistance3: number;
  support1: number;
  support2: number;
  support3: number;
}

interface PivotPointResults {
  pivotPoint: number;
  resistance1: number;
  resistance2: number;
  resistance3: number;
  support1: number;
  support2: number;
  support3: number;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function PivotPointCalculator() {
  const [ohlcData, setOhlcData] = useState<OHLCData>({
    open: '',
    high: '',
    low: '',
    close: ''
  });
  const [results, setResults] = useState<PivotResults | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  // Track tool access when component mounts
  useEffect(() => {
    trackToolAccess('Pivot Point Calculator', 'calculator');
  }, []);

  // Security validation function
  const validateAndSanitizeInput = useCallback((value: string): { isValid: boolean; sanitizedValue: number; error?: string } => {
    // Remove any non-numeric characters except decimal point and minus sign
    const sanitized = value.replace(/[^0-9.-]/g, '');
    
    // Check for multiple decimal points
    const decimalCount = (sanitized.match(/\./g) || []).length;
    if (decimalCount > 1) {
      return { isValid: false, sanitizedValue: 0, error: 'Format angka tidak valid' };
    }
    
    // Check for multiple minus signs or minus not at the beginning
    const minusCount = (sanitized.match(/-/g) || []).length;
    if (minusCount > 1 || (minusCount === 1 && sanitized.indexOf('-') !== 0)) {
      return { isValid: false, sanitizedValue: 0, error: 'Format angka tidak valid' };
    }
    
    const numValue = parseFloat(sanitized);
    
    // Check if it's a valid number
    if (isNaN(numValue)) {
      return { isValid: false, sanitizedValue: 0, error: 'Harus berupa angka yang valid' };
    }
    
    // Check for reasonable range (prevent extremely large numbers)
    if (Math.abs(numValue) > 1000000) {
      return { isValid: false, sanitizedValue: 0, error: 'Nilai terlalu besar (maksimal 1,000,000)' };
    }
    
    // Check for too many decimal places
    const decimalPlaces = sanitized.includes('.') ? sanitized.split('.')[1]?.length || 0 : 0;
    if (decimalPlaces > 8) {
      return { isValid: false, sanitizedValue: 0, error: 'Maksimal 8 angka desimal' };
    }
    
    return { isValid: true, sanitizedValue: numValue };
  }, []);

  // Comprehensive OHLC validation
  const validateOHLCData = useCallback((data: OHLCData): ValidationResult => {
    const errors: string[] = [];
    
    // Convert strings to numbers for validation
    const open = parseFloat(data.open);
    const high = parseFloat(data.high);
    const low = parseFloat(data.low);
    const close = parseFloat(data.close);
    
    // Check if all values are positive (for most financial instruments)
    if (open <= 0) errors.push('Harga Open harus lebih besar dari 0');
    if (high <= 0) errors.push('Harga High harus lebih besar dari 0');
    if (low <= 0) errors.push('Harga Low harus lebih besar dari 0');
    if (close <= 0) errors.push('Harga Close harus lebih besar dari 0');
    
    // Check OHLC logic: High should be the highest, Low should be the lowest
    if (high < open) errors.push('Harga High tidak boleh lebih rendah dari Open');
    if (high < close) errors.push('Harga High tidak boleh lebih rendah dari Close');
    if (high < low) errors.push('Harga High tidak boleh lebih rendah dari Low');
    
    if (low > open) errors.push('Harga Low tidak boleh lebih tinggi dari Open');
    if (low > close) errors.push('Harga Low tidak boleh lebih tinggi dari Close');
    if (low > high) errors.push('Harga Low tidak boleh lebih tinggi dari High');
    
    // Check for reasonable price ranges (prevent manipulation)
    const priceRange = high - low;
    const avgPrice = (open + high + low + close) / 4;
    
    if (priceRange > avgPrice * 0.5) {
      errors.push('Range harga terlalu besar (High-Low > 50% dari rata-rata harga)');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  // Calculate pivot points using standard formula
  const calculatePivotPoints = useCallback((data: OHLCData): PivotPointResults => {
    // Convert strings to numbers
    const high = parseFloat(data.high);
    const low = parseFloat(data.low);
    const close = parseFloat(data.close);
    
    // Standard Pivot Point calculation
    const pivotPoint = (high + low + close) / 3;
    
    // Support and Resistance levels
    const resistance1 = (2 * pivotPoint) - low;
    const support1 = (2 * pivotPoint) - high;
    
    const resistance2 = pivotPoint + (high - low);
    const support2 = pivotPoint - (high - low);
    
    const resistance3 = high + 2 * (pivotPoint - low);
    const support3 = low - 2 * (high - pivotPoint);
    
    return {
      pivotPoint: Math.round(pivotPoint * 100000) / 100000, // Round to 5 decimal places
      resistance1: Math.round(resistance1 * 100000) / 100000,
      resistance2: Math.round(resistance2 * 100000) / 100000,
      resistance3: Math.round(resistance3 * 100000) / 100000,
      support1: Math.round(support1 * 100000) / 100000,
      support2: Math.round(support2 * 100000) / 100000,
      support3: Math.round(support3 * 100000) / 100000
    };
  }, []);

  const handleInputChange = useCallback((field: keyof OHLCData, value: string) => {
    const validation = validateAndSanitizeInput(value);
    
    if (validation.isValid) {
      setOhlcData(prev => ({
        ...prev,
        [field]: validation.sanitizedValue
      }));
      
      // Clear field-specific errors
      setErrors(prev => prev.filter(error => !error.includes(field)));
    } else if (validation.error) {
      setErrors(prev => {
        const filtered = prev.filter(error => !error.includes(field));
        return [...filtered, `${field.toUpperCase()}: ${validation.error}`];
      });
    }
  }, [validateAndSanitizeInput]);

  const handleCalculate = useCallback(async () => {
    setIsCalculating(true);
    setErrors([]);
    const startTime = performance.now();
    let success = false;
    
    try {
      // Validate OHLC data
      const validation = validateOHLCData(ohlcData);
      
      if (!validation.isValid) {
        setErrors(validation.errors);
        setResults(null);
        return;
      }
      
      // Simulate calculation delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Calculate pivot points
      const pivotResults = calculatePivotPoints(ohlcData);
      setResults(pivotResults);
      success = true;
      
    } catch {
      setErrors(['Terjadi kesalahan dalam perhitungan. Silakan coba lagi.']);
      setResults(null);
    } finally {
      setIsCalculating(false);
      
      // Track usage
      const endTime = performance.now();
      const calculationTime = endTime - startTime;
      
      trackToolUsage({
        toolName: 'Pivot Point Calculator',
        toolType: 'calculator',
        usageData: {
          inputParams: {
            hasOpen: !!ohlcData.open,
            hasHigh: !!ohlcData.high,
            hasLow: !!ohlcData.low,
            hasClose: !!ohlcData.close
          },
          calculationTime,
          success
        }
      }).catch(console.warn);
    }
  }, [ohlcData, validateOHLCData, calculatePivotPoints]);

  const handleReset = useCallback(() => {
    setOhlcData({ open: '', high: '', low: '', close: '' });
    setResults(null);
    setErrors([]);
  }, []);

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Input Data OHLC
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="open">Open</Label>
              <Input
                id="open"
                type="text"
                placeholder="0.00000"
                value={ohlcData.open || ''}
                onChange={(e) => handleInputChange('open', e.target.value)}
                className="text-center"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="high">High</Label>
              <Input
                id="high"
                type="text"
                placeholder="0.00000"
                value={ohlcData.high || ''}
                onChange={(e) => handleInputChange('high', e.target.value)}
                className="text-center"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="low">Low</Label>
              <Input
                id="low"
                type="text"
                placeholder="0.00000"
                value={ohlcData.low || ''}
                onChange={(e) => handleInputChange('low', e.target.value)}
                className="text-center"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="close">Close</Label>
              <Input
                id="close"
                type="text"
                placeholder="0.00000"
                value={ohlcData.close || ''}
                onChange={(e) => handleInputChange('close', e.target.value)}
                className="text-center"
              />
            </div>
          </div>
          
          {/* Error Display */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <Button 
              onClick={handleCalculate} 
              disabled={isCalculating || errors.length > 0}
              className="min-w-32"
            >
              {isCalculating ? 'Menghitung...' : 'Hitung Pivot Point'}
            </Button>
            
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Results Display */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Hasil Perhitungan Pivot Point
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Pivot Point */}
              <div className="text-center p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-primary">Pivot Point (PP)</span>
                </div>
                <div className="text-2xl font-bold text-primary">
                  {results.pivotPoint.toFixed(5)}
                </div>
              </div>
              
              {/* Resistance and Support Levels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Resistance Levels */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-5 w-5 text-red-500" />
                    <h3 className="font-semibold text-foreground">Resistance Levels</h3>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                      <Badge variant="destructive">R3</Badge>
                      <span className="font-mono text-red-600 dark:text-red-400">
                        {results.resistance3.toFixed(5)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                      <Badge variant="destructive">R2</Badge>
                      <span className="font-mono text-red-600 dark:text-red-400">
                        {results.resistance2.toFixed(5)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                      <Badge variant="destructive">R1</Badge>
                      <span className="font-mono text-red-600 dark:text-red-400">
                        {results.resistance1.toFixed(5)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Support Levels */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingDown className="h-5 w-5 text-green-500" />
                    <h3 className="font-semibold text-foreground">Support Levels</h3>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                      <Badge className="bg-green-500 hover:bg-green-600">S1</Badge>
                      <span className="font-mono text-green-600 dark:text-green-400">
                        {results.support1.toFixed(5)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                      <Badge className="bg-green-500 hover:bg-green-600">S2</Badge>
                      <span className="font-mono text-green-600 dark:text-green-400">
                        {results.support2.toFixed(5)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                      <Badge className="bg-green-500 hover:bg-green-600">S3</Badge>
                      <span className="font-mono text-green-600 dark:text-green-400">
                        {results.support3.toFixed(5)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Summary */}
              <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
                <h4 className="font-semibold text-foreground mb-2">Ringkasan:</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• <strong>Pivot Point:</strong> Level harga netral berdasarkan data OHLC</p>
                  <p>• <strong>Resistance (R1-R3):</strong> Level dimana harga cenderung mengalami penolakan ke bawah</p>
                  <p>• <strong>Support (S1-S3):</strong> Level dimana harga cenderung mengalami pantulan ke atas</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}