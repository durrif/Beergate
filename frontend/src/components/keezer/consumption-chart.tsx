// src/components/keezer/consumption-chart.tsx — Pour history chart (Recharts)
import { useMemo } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid,
} from 'recharts'
import { useKeezerStore, type PourEntry } from '@/stores/keezer-store'

interface Props {
  tapId?: number // filter to specific tap, or show all
}

export default function ConsumptionChart({ tapId }: Props) {
  const { pourLog } = useKeezerStore()

  // Group by day
  const chartData = useMemo(() => {
    const filtered = tapId
      ? pourLog.filter((p) => p.tapId === tapId)
      : pourLog

    const dayMap = new Map<string, number>()
    for (const p of filtered) {
      const day = p.timestamp.slice(0, 10) // YYYY-MM-DD
      dayMap.set(day, (dayMap.get(day) ?? 0) + p.volume)
    }

    // Last 14 days
    const days: { date: string; label: string; volume: number }[] = []
    const now = new Date()
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000)
      const key = d.toISOString().slice(0, 10)
      days.push({
        date: key,
        label: d.toLocaleDateString('es', { day: '2-digit', month: 'short' }),
        volume: +(dayMap.get(key) ?? 0).toFixed(2),
      })
    }
    return days
  }, [pourLog, tapId])

  const hasData = chartData.some((d) => d.volume > 0)

  if (!hasData) {
    return (
      <div className="text-center py-8 text-text-tertiary text-xs">
        Sin datos de consumo todavía. Pulsa "Servir" para registrar.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(255,255,255,0.04)"
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 9, fill: '#5A6B80' }}
          axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 9, fill: '#5A6B80' }}
          axisLine={false}
          tickLine={false}
          unit="L"
        />
        <Tooltip
          contentStyle={{
            background: '#111A24',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            fontSize: 11,
            color: '#E8E0D4',
          }}
          formatter={(value: number) => [`${value.toFixed(2)}L`, 'Consumo']}
          labelStyle={{ color: '#8B9BB4' }}
        />
        <Bar
          dataKey="volume"
          fill="#F5A623"
          radius={[3, 3, 0, 0]}
          maxBarSize={24}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
