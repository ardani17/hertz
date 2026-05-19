export function normalizeSparkline(points: number[], width = 640, height = 220) {
  const values = points.filter((point) => Number.isFinite(point));
  if (values.length < 2) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return { x, y };
  });
}

export function buildSparklinePath(points: number[], width = 640, height = 220) {
  return normalizeSparkline(points, width, height)
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(' ');
}

export function buildSparklineArea(points: number[], width = 640, height = 220) {
  const normalized = normalizeSparkline(points, width, height);
  if (normalized.length < 2) return '';
  const line = normalized
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(' ');
  return `${line} L${width} ${height} L0 ${height} Z`;
}
