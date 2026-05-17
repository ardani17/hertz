'use client';

import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts';

export interface SparklinePoint {
  value: number;
}

export function toSparklineData(points: number[] | undefined): SparklinePoint[] {
  const values = points?.filter((point) => Number.isFinite(point)) ?? [];
  const safeValues = values.length >= 2 ? values : [4.8, 5.1, 4.9, 5.4, 5.2, 5.7, 5.5];
  return safeValues.map((value) => ({ value }));
}

export function getSparklineDomain(points: number[] | undefined): [number, number] {
  const values = toSparklineData(points).map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const padding = range > 0 ? range * 0.18 : Math.max(Math.abs(max) * 0.01, 1);
  return [min - padding, max + padding];
}

export function Sparkline({
  points,
  color,
  gradientId,
  height,
  showFill = true,
}: {
  points?: number[];
  color: string;
  gradientId: string;
  height: number;
  showFill?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        accessibilityLayer={false}
        data={toSparklineData(points)}
        margin={{ top: 4, right: 0, bottom: 2, left: 0 }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.36} />
            <stop offset="90%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <YAxis hide domain={getSparklineDomain(points)} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={showFill ? 2.2 : 1.7}
          fill={showFill ? `url(#${gradientId})` : 'transparent'}
          dot={false}
          isAnimationActive
          animationDuration={420}
          activeDot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
