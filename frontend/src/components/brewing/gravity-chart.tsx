// src/components/brewing/gravity-chart.tsx
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { FermentationDataPoint } from "@/lib/types";

interface GravityChartProps {
  data: FermentationDataPoint[];
  height?: number;
}

interface ChartEntry {
  time: string;
  gravity?: number | null;
  temperature?: number | null;
}

export function GravityChart({ data, height = 240 }: GravityChartProps) {
  const chartData: ChartEntry[] = data.map((p) => ({
    time: format(
      typeof p.recorded_at === "string" ? parseISO(p.recorded_at) : new Date(p.recorded_at),
      "dd/MM HH:mm",
      { locale: es }
    ),
    gravity: p.gravity ? Math.round(p.gravity * 1000) : null, // SG → points (e.g. 1050)
    temperature: p.temperature,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(255,255,255,0.06)"
          vertical={false}
        />
        <XAxis
          dataKey="time"
          tick={{ fill: "#9CA3AF", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          yAxisId="gravity"
          orientation="left"
          tick={{ fill: "#D4A04A", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          domain={["auto", "auto"]}
          label={{ value: "Densidad (SG×1000)", angle: -90, position: "insideLeft", fill: "#D4A04A", fontSize: 10 }}
        />
        <YAxis
          yAxisId="temp"
          orientation="right"
          tick={{ fill: "#60A5FA", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          domain={["auto", "auto"]}
          label={{ value: "°C", angle: 90, position: "insideRight", fill: "#60A5FA", fontSize: 10 }}
        />
        <Tooltip
          contentStyle={{
            background: "#1A1A1E",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            fontSize: 12,
          }}
          labelStyle={{ color: "#D1D5DB" }}
          itemStyle={{ color: "#D4A04A" }}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, color: "#9CA3AF" }}
          iconType="circle"
        />
        <Line
          yAxisId="gravity"
          type="monotone"
          dataKey="gravity"
          name="Densidad (×1000)"
          stroke="#D4A04A"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "#D4A04A" }}
          connectNulls
        />
        <Line
          yAxisId="temp"
          type="monotone"
          dataKey="temperature"
          name="Temp (°C)"
          stroke="#60A5FA"
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 3, fill: "#60A5FA" }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
