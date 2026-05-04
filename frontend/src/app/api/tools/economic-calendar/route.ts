import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function formatDate(date: Date) {
  return date.toISOString().split('T')[0];
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getDateRange(period: string) {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  const day = now.getDay();
  const mondayOffset = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(mondayOffset);

  if (period === 'tomorrow') {
    const tomorrow = addDays(now, 1);
    return { startDate: formatDate(tomorrow), endDate: formatDate(tomorrow) };
  }

  if (period === 'this-week') {
    return { startDate: formatDate(monday), endDate: formatDate(addDays(monday, 6)) };
  }

  if (period === 'next-week') {
    const nextMonday = addDays(monday, 7);
    return { startDate: formatDate(nextMonday), endDate: formatDate(addDays(nextMonday, 6)) };
  }

  return { startDate: formatDate(now), endDate: formatDate(now) };
}

async function fetchCalendar(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'HorizonTraderPlatform/1.0',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) {
    throw new Error(`Upstream status ${response.status}`);
  }

  return response.json();
}

function normalizeCountryCode(countryCode: string | null) {
  if (!countryCode || countryCode === 'all') return null;
  return countryCode === 'EU' ? 'EMU' : countryCode;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const period = params.get('period') ?? 'today';
  const volatility = params.get('volatility') ?? 'MEDIUM,HIGH';
  const countryCode = normalizeCountryCode(params.get('countryCode'));
  const timezone = 'GMT+7';
  const { startDate, endDate } = getDateRange(period);

  try {
    const allData = [];
    const volatilities = volatility.split(',').map((item) => item.trim()).filter(Boolean);

    for (const item of volatilities) {
      const upstream = new URL('https://calendar.quantapi.vip/calendar');
      upstream.searchParams.set('volatility', item);
      upstream.searchParams.set('startDate', startDate);
      upstream.searchParams.set('endDate', endDate);
      upstream.searchParams.set('limit', '500');
      upstream.searchParams.set('timezone', timezone);
      if (countryCode) {
        upstream.searchParams.set('countryCode', countryCode);
      }

      const json = await fetchCalendar(upstream.toString());
      if (Array.isArray(json.data)) {
        allData.push(...json.data);
      }
    }

    const unique = allData
      .filter((event, index, self) => index === self.findIndex((item) => item.eventId === event.eventId))
      .sort((a, b) => new Date(a.dateUtc).getTime() - new Date(b.dateUtc).getTime());

    return NextResponse.json({
      success: true,
      data: unique,
      totalEvents: unique.length,
      dateRange: { start: startDate, end: endDate },
      lastUpdated: new Date().toISOString(),
      source: 'QuantAPI',
      timezone,
    }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'External calendar unavailable',
      data: [],
      totalEvents: 0,
      dateRange: { start: startDate, end: endDate },
      lastUpdated: new Date().toISOString(),
      source: 'QuantAPI',
      timezone,
    }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
