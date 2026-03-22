// src/components/shop/sparkline.tsx
// Tiny SVG sparkline – no charting library required
import { cn } from "@/lib/utils";

interface SparklineProps {
  data: number[];
  className?: string;
  strokeColor?: string;
}

export function Sparkline({ data, className, strokeColor = "#f59e0b" }: SparklineProps) {
  if (data.length < 2) return null;

  const width = 80;
  const height = 40;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  });

  const polyline = points.join(" ");

  // Fill area under curve
  const fillPath = `M0,${height} L${points[0]} L${points.slice(1).join(" L")} L${width},${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill="url(#spark-fill)" />
      <polyline
        points={polyline}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
