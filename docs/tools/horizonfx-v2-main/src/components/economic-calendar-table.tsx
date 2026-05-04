'use client';

import { useState, useEffect, Fragment } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { CalendarDays, TrendingUp, TrendingDown, Minus, Filter, ChevronDown, Calendar } from 'lucide-react';
import { trackToolAccess, trackToolUsage } from '@/lib/analytics';

type DateFilterType = 'yesterday' | 'today' | 'tomorrow' | 'this-week' | 'next-week' | 'last-week' | 'this-month' | 'next-month' | 'last-month';

const dateFilters: { value: DateFilterType; label: string }[] = [
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'this-week', label: 'This Week' },
  { value: 'next-week', label: 'Next Week' },
  { value: 'last-week', label: 'Last Week' },
  { value: 'this-month', label: 'This Month' },
  { value: 'next-month', label: 'Next Month' },
  { value: 'last-month', label: 'Last Month' },
];

interface EconomicEvent {
  id: string;
  eventId: string;
  dateUtc: string;
  periodDateUtc: string;
  periodType: string;
  actual: number | null;
  revised: number | null;
  consensus: number | null;
  ratioDeviation: number | null;
  previous: number | null;
  isBetterThanExpected: boolean | null;
  name: string;
  countryCode: string;
  currencyCode: string;
  unit: string;
  potency: string;
  volatility: string;
  isAllDay: boolean;
  isTentative: boolean;
  isPreliminary: boolean;
  isReport: boolean;
  isSpeech: boolean;
  lastUpdated: number;
  previousIsPreliminary: boolean;
  categoryId: string;
  hasHistorical: boolean;
}

interface EconomicCalendarResponse {
  success: boolean;
  message: string;
  data: EconomicEvent[];
  lastUpdated: string;
  totalEvents: number;
  timezone: string;
  volatilityBreakdown: {
    NONE: number;
    LOW: number;
    MEDIUM: number;
    HIGH: number;
  };
  dateRange: {
    start: string;
    end: string;
  };
  maxLimit: number;
}

const getVolatilityColor = (volatility: string) => {
  switch (volatility.toUpperCase()) {
    case 'HIGH':
      return 'bg-red-500/10 text-red-500 border-red-500/20';
    case 'MEDIUM':
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    case 'LOW':
      return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 'NONE':
      return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    default:
      return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  }
};

const getChangeIcon = (actual: number | null, previous: number | null) => {
  if (actual === null || previous === null) {
    return <Minus className="h-3 w-3" />;
  }
  
  if (actual > previous) {
    return <TrendingUp className="h-3 w-3 text-green-500" />;
  } else if (actual < previous) {
    return <TrendingDown className="h-3 w-3 text-red-500" />;
  }
  return <Minus className="h-3 w-3" />;
};

const formatTime = (dateString: string) => {
  // Extract time directly from ISO string without timezone conversion
  // "2025-08-19T19:30:00.000Z" -> "19.30"
  const timeMatch = dateString.match(/T(\d{2}):(\d{2})/);
  if (timeMatch) {
    return `${timeMatch[1]}.${timeMatch[2]}`;
  }
  return dateString;
};

const formatCountryName = (countryCode: string) => {
  const countryMap: { [key: string]: string } = {
    'US': 'United States',
    'GB': 'United Kingdom',
    'EU': 'European Union',
    'JP': 'Japan',
    'DE': 'Germany',
    'FR': 'France',
    'CA': 'Canada',
    'AU': 'Australia',
    'CH': 'Switzerland',
    'CN': 'China',
    'NZ': 'New Zealand',
    'IT': 'Italy',
    'ES': 'Spain'
  };
  return countryMap[countryCode] || countryCode;
};

const formatDateHeader = (dateString: string) => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return date.toLocaleDateString('en-US', options);
};

const getDateFromUtc = (dateUtc: string) => {
  return dateUtc.split('T')[0];
};



export default function EconomicCalendarTable() {
  const [data, setData] = useState<EconomicCalendarResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [volatilityFilter, setVolatilityFilter] = useState<'HIGH' | 'MEDIUM' | 'ALL'>('MEDIUM');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('today');
  const [showVolatilityDropdown, setShowVolatilityDropdown] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  // List of countries for filter with codes
  const countries = [
    { code: 'all', name: 'All Countries' },
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'DE', name: 'Germany' },
    { code: 'JP', name: 'Japan' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'CH', name: 'Switzerland' },
    { code: 'NZ', name: 'New Zealand' },
    { code: 'CN', name: 'China' },
    { code: 'IN', name: 'India' },
    { code: 'FR', name: 'France' },
    { code: 'IT', name: 'Italy' },
    { code: 'ES', name: 'Spain' }
  ];

  // Track tool access on component mount
  useEffect(() => {
    trackToolAccess('Economic Calendar', 'data');
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let url = `/api/economic-calendar?period=${dateFilter}`;
        
        if (volatilityFilter === 'ALL') {
          url += `&volatility=MEDIUM,HIGH`;
        } else {
          url += `&volatility=${volatilityFilter}`;
        }
        if (countryFilter !== 'all') {
          url += `&countryCode=${encodeURIComponent(countryFilter)}`;
        }
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Sort data by time (dateUtc)
        if (result.success && result.data) {
          result.data.sort((a: EconomicEvent, b: EconomicEvent) => {
            return new Date(a.dateUtc).getTime() - new Date(b.dateUtc).getTime();
          });
        }
        
        setData(result);
        setError(null);
        
        // Track successful data load
        if (result.success) {
          trackToolUsage({
            toolName: 'Economic Calendar',
            toolType: 'data',
            usageData: {
              inputParams: {
                volatilityFilter,
                countryFilter,
                dateFilter,
                eventsCount: result.totalEvents
              },
              success: true
            }
          });
        }
      } catch (err) {
        console.error('Error fetching economic calendar:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [volatilityFilter, countryFilter, dateFilter]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <CalendarDays className="h-5 w-5" />
            <CardTitle>Economic Calendar</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <CalendarDays className="h-5 w-5" />
            <CardTitle>Economic Calendar</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Error loading economic calendar data</p>
            <p className="text-sm text-red-500 mt-2">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.success || !data.data.length) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <CalendarDays className="h-5 w-5" />
            <CardTitle>Economic Calendar</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No economic events found for {dateFilters.find(d => d.value === dateFilter)?.label.toLowerCase() || 'selected period'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CalendarDays className="h-5 w-5" />
            <CardTitle>Economic Calendar</CardTitle>
          </div>
          {/* Desktop layout - hide on mobile */}
          <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
            <span>Total Events: {data.totalEvents}</span>
            <Badge variant="outline" className={getVolatilityColor('HIGH')}>
              High Volatility: {data.volatilityBreakdown.HIGH}
            </Badge>
            <Badge variant="outline" className={getVolatilityColor('MEDIUM')}>
              Medium Volatility: {data.volatilityBreakdown.MEDIUM}
            </Badge>
          </div>
        </div>
        
        {/* Mobile layout - show only on mobile */}
        <div className="md:hidden space-y-3 mt-4">
          <div className="text-sm text-muted-foreground">
            <span>Total Events: {data.totalEvents}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className={getVolatilityColor('HIGH')}>
              High Volatility: {data.volatilityBreakdown.HIGH}
            </Badge>
            <Badge variant="outline" className={getVolatilityColor('MEDIUM')}>
              Medium Volatility: {data.volatilityBreakdown.MEDIUM}
            </Badge>
          </div>
        </div>
        
        {/* Filter Dropdowns */}
        <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4 mt-4">
          {/* Desktop layout */}
          <div className="hidden md:flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            
            {/* Volatility Filter Dropdown */}
            <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowVolatilityDropdown(!showVolatilityDropdown);
                setShowCountryDropdown(false);
                setShowDateDropdown(false);
              }}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <span>
                {volatilityFilter === 'HIGH' ? 'High Volatility' : 
                 volatilityFilter === 'MEDIUM' ? 'Medium Volatility' : 
                 'All Volatility'}
              </span>
              <ChevronDown className="h-3 w-3" />
            </Button>
            {showVolatilityDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-background border rounded-md shadow-lg z-10 min-w-[140px]">
                <button
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground ${
                    volatilityFilter === 'ALL' ? 'bg-accent text-accent-foreground font-medium' : ''
                  }`}
                  onClick={() => {
                    setVolatilityFilter('ALL');
                    setShowVolatilityDropdown(false);
                  }}
                >
                  All Volatility
                </button>
                <button
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground ${
                    volatilityFilter === 'HIGH' ? 'bg-accent text-accent-foreground font-medium' : ''
                  }`}
                  onClick={() => {
                    setVolatilityFilter('HIGH');
                    setShowVolatilityDropdown(false);
                  }}
                >
                  High Volatility
                </button>
                <button
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground ${
                    volatilityFilter === 'MEDIUM' ? 'bg-accent text-accent-foreground font-medium' : ''
                  }`}
                  onClick={() => {
                    setVolatilityFilter('MEDIUM');
                    setShowVolatilityDropdown(false);
                  }}
                >
                  Medium Volatility
                </button>
              </div>
            )}
          </div>
          
          {/* Country Filter Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowCountryDropdown(!showCountryDropdown);
                setShowVolatilityDropdown(false);
                setShowDateDropdown(false);
              }}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <span>{countries.find(c => c.code === countryFilter)?.name || 'All Countries'}</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
            {showCountryDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-background border rounded-md shadow-lg z-10 min-w-[150px] max-h-60 overflow-y-auto">
                {countries.map((country) => (
                  <button
                    key={country.code}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground ${
                      countryFilter === country.code ? 'bg-accent text-accent-foreground font-medium' : ''
                    }`}
                    onClick={() => {
                      setCountryFilter(country.code);
                      setShowCountryDropdown(false);
                    }}
                  >
                    {country.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Date Filter Dropdown - Desktop */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowDateDropdown(!showDateDropdown);
                setShowVolatilityDropdown(false);
                setShowCountryDropdown(false);
              }}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <Calendar className="h-3 w-3" />
              <span>{dateFilters.find(d => d.value === dateFilter)?.label || 'Today'}</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
            {showDateDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-background border rounded-md shadow-lg z-10 min-w-[140px] max-h-60 overflow-y-auto">
                {dateFilters.map((filter) => (
                  <button
                    key={filter.value}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground ${
                      dateFilter === filter.value ? 'bg-accent text-accent-foreground font-medium' : ''
                    }`}
                    onClick={() => {
                      setDateFilter(filter.value);
                      setShowDateDropdown(false);
                    }}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
          
          {/* Mobile layout */}
          <div className="md:hidden space-y-3">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filter Data</span>
            </div>
            
            {/* Date Filter Dropdown - Mobile */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowDateDropdown(!showDateDropdown);
                  setShowVolatilityDropdown(false);
                  setShowCountryDropdown(false);
                }}
                disabled={loading}
                className="flex items-center space-x-2 w-full justify-between"
              >
                <div className="flex items-center space-x-2">
                  <Calendar className="h-3 w-3" />
                  <span>{dateFilters.find(d => d.value === dateFilter)?.label || 'Today'}</span>
                </div>
                <ChevronDown className="h-3 w-3" />
              </Button>
              {showDateDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-background border rounded-md shadow-lg z-10 min-w-full max-h-60 overflow-y-auto">
                  {dateFilters.map((filter) => (
                    <button
                      key={filter.value}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground ${
                        dateFilter === filter.value ? 'bg-accent text-accent-foreground font-medium' : ''
                      }`}
                      onClick={() => {
                        setDateFilter(filter.value);
                        setShowDateDropdown(false);
                      }}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Volatility Filter Dropdown - Mobile */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowVolatilityDropdown(!showVolatilityDropdown);
                  setShowCountryDropdown(false);
                  setShowDateDropdown(false);
                }}
                disabled={loading}
                className="flex items-center space-x-2 w-full justify-between"
              >
                <span>
                  {volatilityFilter === 'HIGH' ? 'High Volatility' : 
                   volatilityFilter === 'MEDIUM' ? 'Medium Volatility' : 
                   'All Volatility'}
                </span>
                <ChevronDown className="h-3 w-3" />
              </Button>
              {showVolatilityDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-background border rounded-md shadow-lg z-10 min-w-full">
                  <button
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground ${
                      volatilityFilter === 'ALL' ? 'bg-accent text-accent-foreground font-medium' : ''
                    }`}
                    onClick={() => {
                      setVolatilityFilter('ALL');
                      setShowVolatilityDropdown(false);
                    }}
                  >
                    All Volatility
                  </button>
                  <button
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground ${
                      volatilityFilter === 'HIGH' ? 'bg-accent text-accent-foreground font-medium' : ''
                    }`}
                    onClick={() => {
                      setVolatilityFilter('HIGH');
                      setShowVolatilityDropdown(false);
                    }}
                  >
                    High Volatility
                  </button>
                  <button
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground ${
                      volatilityFilter === 'MEDIUM' ? 'bg-accent text-accent-foreground font-medium' : ''
                    }`}
                    onClick={() => {
                      setVolatilityFilter('MEDIUM');
                      setShowVolatilityDropdown(false);
                    }}
                  >
                    Medium Volatility
                  </button>
                </div>
              )}
            </div>
            
            {/* Country Filter Dropdown - Mobile */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCountryDropdown(!showCountryDropdown);
                  setShowVolatilityDropdown(false);
                  setShowDateDropdown(false);
                }}
                disabled={loading}
                className="flex items-center space-x-2 w-full justify-between"
              >
                <span>{countries.find(c => c.code === countryFilter)?.name || 'All Countries'}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
              {showCountryDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-background border rounded-md shadow-lg z-10 min-w-full max-h-60 overflow-y-auto">
                  {countries.map((country) => (
                    <button
                      key={country.code}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground ${
                        countryFilter === country.code ? 'bg-accent text-accent-foreground font-medium' : ''
                      }`}
                      onClick={() => {
                        setCountryFilter(country.code);
                        setShowCountryDropdown(false);
                      }}
                    >
                      {country.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 font-medium text-sm">Time</th>
                <th className="text-left py-3 px-2 font-medium text-sm">Country</th>
                <th className="text-left py-3 px-2 font-medium text-sm">Event</th>
                <th className="text-left py-3 px-2 font-medium text-sm">Volatility</th>
                <th className="text-left py-3 px-2 font-medium text-sm">Actual</th>
                <th className="text-left py-3 px-2 font-medium text-sm">Forecast</th>
                <th className="text-left py-3 px-2 font-medium text-sm">Previous</th>
                <th className="text-left py-3 px-2 font-medium text-sm">Revised</th>
                <th className="text-left py-3 px-2 font-medium text-sm">Type</th>
                <th className="text-left py-3 px-2 font-medium text-sm">Change</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((event, index) => {
                const currentDate = getDateFromUtc(event.dateUtc);
                const previousDate = index > 0 ? getDateFromUtc(data.data[index - 1].dateUtc) : null;
                const showDateHeader = currentDate !== previousDate;
                
                return (
                  <Fragment key={`event-group-${event.id}-${index}`}>
                    {showDateHeader && (
                      <tr className="bg-muted/30">
                        <td colSpan={10} className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <CalendarDays className="h-4 w-4 text-primary" />
                            <span className="font-semibold text-sm text-primary">
                              {formatDateHeader(event.dateUtc)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}
                    <tr className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-2 text-sm font-mono">
                        {formatTime(event.dateUtc)}
                      </td>
                      <td className="py-3 px-2 text-sm">
                        <span className="font-medium">
                          {formatCountryName(event.countryCode)}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-sm">
                        <div className="max-w-xs">
                          <p className="font-medium truncate">{event.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {event.currencyCode} • {event.potency}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getVolatilityColor(event.volatility)}`}
                        >
                          {event.volatility}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-sm font-mono">
                        <span className={event.actual !== null ? 'font-semibold' : 'text-muted-foreground'}>
                          {event.actual !== null ? event.actual.toString() : '-'}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-sm font-mono text-muted-foreground">
                        {event.consensus !== null ? event.consensus.toString() : '-'}
                      </td>
                      <td className="py-3 px-2 text-sm font-mono text-muted-foreground">
                        {event.previous !== null ? event.previous.toString() : '-'}
                      </td>
                      <td className="py-3 px-2 text-sm font-mono text-muted-foreground">
                        {event.revised !== null ? event.revised.toString() : '-'}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex flex-wrap gap-1">
                          {event.isTentative && (
                            <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-500 border-blue-500/20">
                              Tentative
                            </Badge>
                          )}
                          {event.isPreliminary && (
                            <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-500 border-orange-500/20">
                              Preliminary
                            </Badge>
                          )}
                          {event.isReport && (
                            <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-500 border-purple-500/20">
                              Report
                            </Badge>
                          )}
                          {event.isSpeech && (
                            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/20">
                              Speech
                            </Badge>
                          )}
                          {!event.isTentative && !event.isPreliminary && !event.isReport && !event.isSpeech && (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center justify-center">
                          {getChangeIcon(event.actual, event.previous)}
                        </div>
                      </td>
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Last Updated: {new Date(data.lastUpdated).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}</span>
            <span>Timezone: {data.timezone}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}