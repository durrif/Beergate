// src/pages/analytics.tsx — Beergate v3 Analytics Dashboard with Recharts
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown, Minus, Beaker, Package,
  DollarSign,
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar, CartesianGrid,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from 'recharts'
import { useUIStore } from '@/stores/ui-store'

// ---- Mock data ----

const mockKpis = [
  { key: 'batches', value: 12, prev: 9, icon: Beaker, color: '#F5A623' },
  { key: 'efficiency', value: 72.5, prev: 70.1, icon: TrendingUp, color: '#7CB342', suffix: '%' },
  { key: 'cost_per_liter', value: 1.85, prev: 2.10, icon: DollarSign, color: '#42A5F5', prefix: '€', invert: true },
  { key: 'ingredients_used', value: 48.2, prev: 42.0, icon: Package, color: '#D4723C', suffix: ' kg' },
]

const efficiencyTrend = [
  { month: 'Oct', efficiency: 68, batches: 2 },
  { month: 'Nov', efficiency: 71, batches: 1 },
  { month: 'Dic', efficiency: 69, batches: 2 },
  { month: 'Ene', efficiency: 72, batches: 2 },
  { month: 'Feb', efficiency: 74, batches: 1 },
  { month: 'Mar', efficiency: 73, batches: 3 },
]

const costTrend = [
  { month: 'Oct', cost: 2.20 },
  { month: 'Nov', cost: 2.05 },
  { month: 'Dic', cost: 2.15 },
  { month: 'Ene', cost: 1.95 },
  { month: 'Feb', cost: 1.90 },
  { month: 'Mar', cost: 1.85 },
]

const styleDistribution = [
  { name: 'IPA', value: 5, color: '#F5A623' },
  { name: 'Amber Ale', value: 3, color: '#D4723C' },
  { name: 'Wheat Beer', value: 2, color: '#FFF8E7' },
  { name: 'Stout', value: 2, color: '#2C1810' },
  { name: 'Pale Ale', value: 1, color: '#7CB342' },
  { name: 'Lager', value: 1, color: '#42A5F5' },
]

const ingredientUsage = [
  { name: 'Pale Malt', kg: 28 },
  { name: 'Munich', kg: 8 },
  { name: 'Crystal 60', kg: 4 },
  { name: 'Cascade', kg: 1.2 },
  { name: 'Centennial', kg: 0.9 },
  { name: 'Citra', kg: 0.8 },
  { name: 'US-05', kg: 0.3 },
  { name: 'Wheat Malt', kg: 5 },
]

const fermentationPerformance = [
  { batch: 'IPA #8', og: 1.065, fg: 1.012, attenuation: 81.5, days: 12 },
  { batch: 'Amber #5', og: 1.052, fg: 1.014, attenuation: 73.1, days: 14 },
  { batch: 'Stout #3', og: 1.058, fg: 1.016, attenuation: 72.4, days: 18 },
  { batch: 'Wheat #2', og: 1.048, fg: 1.010, attenuation: 79.2, days: 10 },
  { batch: 'IPA #9', og: 1.068, fg: 1.011, attenuation: 83.8, days: 11 },
]

const seasonalData = [
  { month: 'Ene', liters: 40 },
  { month: 'Feb', liters: 20 },
  { month: 'Mar', liters: 60 },
  { month: 'Abr', liters: 38 },
  { month: 'May', liters: 19 },
  { month: 'Jun', liters: 57 },
  { month: 'Jul', liters: 35 },
  { month: 'Ago', liters: 25 },
  { month: 'Sep', liters: 45 },
  { month: 'Oct', liters: 50 },
  { month: 'Nov', liters: 30 },
  { month: 'Dic', liters: 42 },
]

const radarData = [
  { metric: 'Eficiencia', value: 73 },
  { metric: 'Consistencia', value: 68 },
  { metric: 'Variedad', value: 82 },
  { metric: 'Costo', value: 75 },
  { metric: 'Frecuencia', value: 60 },
  { metric: 'Calidad', value: 85 },
]

// ---- Components ----

function KpiCard({ kpi, i }: { kpi: typeof mockKpis[0]; i: number }) {
  const { t } = useTranslation('analytics')
  const diff = kpi.value - kpi.prev
  const pct = kpi.prev !== 0 ? Math.abs((diff / kpi.prev) * 100) : 0
  const isUp = diff > 0
  const isGood = kpi.invert ? !isUp : isUp

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: i * 0.06 }}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14,
        padding: '16px 18px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `${kpi.color}12`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <kpi.icon size={18} color={kpi.color} />
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 3,
          padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
          background: pct < 0.5 ? 'rgba(139,155,180,0.12)' :
            isGood ? 'rgba(124,179,66,0.12)' : 'rgba(239,83,80,0.12)',
          color: pct < 0.5 ? '#8B9BB4' : isGood ? '#7CB342' : '#EF5350',
        }}>
          {pct < 0.5 ? <Minus size={11} /> : isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {pct < 0.5 ? '0%' : `${pct.toFixed(1)}%`}
        </div>
      </div>
      <div style={{
        fontSize: 26, fontWeight: 700, color: '#E8E0D4',
        fontFamily: "'Space Grotesk', sans-serif",
        lineHeight: 1.1,
      }}>
        {kpi.prefix}{typeof kpi.value === 'number' && kpi.value % 1 !== 0 ? kpi.value.toFixed(1) : kpi.value}{kpi.suffix}
      </div>
      <div style={{ fontSize: 11, color: '#8B9BB4', marginTop: 4 }}>
        {t(`kpi.${kpi.key}`, kpi.key)}
      </div>
    </motion.div>
  )
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#111820', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8, padding: '8px 12px', fontSize: 12,
    }}>
      <div style={{ color: '#8B9BB4', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: '#E8E0D4', fontWeight: 600 }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
        </div>
      ))}
    </div>
  )
}

function ChartCard({ title, children, delay = 0 }: {
  title: string; children: React.ReactNode; delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16,
        padding: 20,
      }}
    >
      <h3 style={{
        fontSize: 13, fontWeight: 600, color: '#E8E0D4', margin: '0 0 16px',
        fontFamily: "'Space Grotesk', sans-serif",
      }}>
        {title}
      </h3>
      {children}
    </motion.div>
  )
}

// ---- Main page ----

export default function AnalyticsPage() {
  const { t } = useTranslation(['common', 'analytics'])
  const { setActivePage } = useUIStore()
  const [timeRange, setTimeRange] = useState('6m')

  useEffect(() => { setActivePage('analytics') }, [setActivePage])

  return (
    <div style={{ padding: '16px 24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: 20, flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <h1 style={{
            fontSize: 24, fontWeight: 700, color: '#E8E0D4', margin: 0,
            fontFamily: "'Space Grotesk', sans-serif",
          }}>
            📊 {t('nav.analytics')}
          </h1>
          <p style={{ fontSize: 13, color: '#8B9BB4', margin: '4px 0 0' }}>
            {t('analytics:subtitle')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['6m', '12m', 'all'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                border: 'none', cursor: 'pointer',
                background: timeRange === range ? 'rgba(245,166,35,0.15)' : 'rgba(255,255,255,0.05)',
                color: timeRange === range ? '#F5A623' : '#8B9BB4',
                transition: 'all 0.2s',
              }}
            >
              {range === '6m' ? t('analytics:last_6m') : range === '12m' ? t('analytics:last_12m') : t('analytics:all_time')}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 10,
        marginBottom: 20,
      }}>
        {mockKpis.map((kpi, i) => (
          <KpiCard key={kpi.key} kpi={kpi} i={i} />
        ))}
      </div>

      {/* Charts row 1: Efficiency trend + Cost trend */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: 16, marginBottom: 16,
      }}>
        <ChartCard title={t('analytics:efficiency_trend', 'Tendencia de eficiencia')} delay={0.15}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={efficiencyTrend}>
              <defs>
                <linearGradient id="gradEff" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7CB342" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#7CB342" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#5A6B80', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[60, 85]} tick={{ fill: '#5A6B80', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="efficiency" stroke="#7CB342" strokeWidth={2}
                fill="url(#gradEff)" name={t('analytics:kpi.efficiency', 'Eficiencia')} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('analytics:cost_trend', 'Coste por litro')} delay={0.2}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={costTrend}>
              <defs>
                <linearGradient id="gradCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#42A5F5" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#42A5F5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#5A6B80', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[1.5, 2.5]} tick={{ fill: '#5A6B80', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="cost" stroke="#42A5F5" strokeWidth={2}
                fill="url(#gradCost)" name="€/L" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts row 2: Style donut + Ingredient usage bars */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: 16, marginBottom: 16,
      }}>
        <ChartCard title={t('analytics:style_distribution', 'Distribución de estilos')} delay={0.25}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie
                  data={styleDistribution}
                  cx="50%" cy="50%"
                  innerRadius={50} outerRadius={80}
                  dataKey="value"
                  stroke="none"
                  animationBegin={300} animationDuration={800}
                >
                  {styleDistribution.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              {styleDistribution.map(s => (
                <div key={s.name} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  marginBottom: 6,
                }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: 3,
                    background: s.color,
                    border: s.color === '#FFF8E7' || s.color === '#2C1810'
                      ? '1px solid rgba(255,255,255,0.2)' : 'none',
                  }} />
                  <span style={{ fontSize: 12, color: '#E8E0D4', flex: 1 }}>{s.name}</span>
                  <span style={{
                    fontSize: 12, fontWeight: 600, color: '#F5A623',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        <ChartCard title={t('analytics:ingredient_usage', 'Uso de ingredientes (kg)')} delay={0.3}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ingredientUsage} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#5A6B80', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={80}
                tick={{ fill: '#8B9BB4', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="kg" fill="#D4723C" radius={[0, 4, 4, 0]} barSize={14} name="kg" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts row 3: Fermentation table + Seasonal bars */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: 16, marginBottom: 16,
      }}>
        <ChartCard title={t('analytics:fermentation_comparison', 'Rendimiento de fermentación')} delay={0.35}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {[t('analytics:table.batch', 'Batch'), 'OG', 'FG', t('analytics:table.attenuation', 'Att.'), t('analytics:table.days', 'Days')].map(h => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '6px 8px', color: '#5A6B80',
                      fontWeight: 600, fontSize: 10, textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fermentationPerformance.map((row, i) => (
                  <tr key={i} style={{
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                  }}>
                    <td style={{ padding: '8px', color: '#E8E0D4', fontWeight: 500 }}>{row.batch}</td>
                    <td style={{ padding: '8px', color: '#F5A623', fontFamily: "'JetBrains Mono', monospace" }}>
                      {row.og.toFixed(3)}
                    </td>
                    <td style={{ padding: '8px', color: '#D4723C', fontFamily: "'JetBrains Mono', monospace" }}>
                      {row.fg.toFixed(3)}
                    </td>
                    <td style={{ padding: '8px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                        background: row.attenuation > 80 ? 'rgba(124,179,66,0.12)' :
                          row.attenuation > 70 ? 'rgba(245,166,35,0.12)' : 'rgba(239,83,80,0.12)',
                        color: row.attenuation > 80 ? '#7CB342' :
                          row.attenuation > 70 ? '#F5A623' : '#EF5350',
                      }}>
                        {row.attenuation.toFixed(1)}%
                      </span>
                    </td>
                    <td style={{ padding: '8px', color: '#8B9BB4', fontFamily: "'JetBrains Mono', monospace" }}>
                      {row.days}d
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>

        <ChartCard title={t('analytics:seasonal_patterns', 'Patrón estacional (litros/mes)')} delay={0.4}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={seasonalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#5A6B80', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#5A6B80', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="liters" radius={[4, 4, 0, 0]} barSize={20} name={t('analytics:liters', 'Litros')}>
                {seasonalData.map((entry, i) => (
                  <Cell key={i} fill={entry.liters > 45 ? '#F5A623' : entry.liters > 30 ? '#D4723C' : '#5A6B80'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Brewery Radar Score */}
      <ChartCard title={t('analytics:brewery_score', 'Perfil de tu cervecería')} delay={0.45}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <ResponsiveContainer width={280} height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#8B9BB4', fontSize: 11 }} />
              <Radar name={t('analytics:score', 'Score')} dataKey="value"
                stroke="#F5A623" fill="#F5A623" fillOpacity={0.15} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{
              fontSize: 48, fontWeight: 800, color: '#F5A623',
              fontFamily: "'Space Grotesk', sans-serif",
              lineHeight: 1,
            }}>
              {Math.round(radarData.reduce((s, d) => s + d.value, 0) / radarData.length)}
            </div>
            <div style={{ fontSize: 13, color: '#8B9BB4', marginTop: 4 }}>
              {t('analytics:overall_score', 'Puntuación general')}
            </div>
            <div style={{
              marginTop: 12,
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              {[...radarData]
                .sort((a, b) => b.value - a.value)
                .slice(0, 3)
                .map(d => (
                  <div key={d.metric} style={{
                    display: 'flex', alignItems: 'center', gap: 8, fontSize: 12,
                  }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: d.value > 75 ? '#7CB342' : '#F5A623',
                    }} />
                    <span style={{ color: '#E8E0D4' }}>{d.metric}</span>
                    <span style={{
                      marginLeft: 'auto', color: '#F5A623',
                      fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                    }}>
                      {d.value}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </ChartCard>
    </div>
  )
}
