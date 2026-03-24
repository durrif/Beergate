// src/pages/keezer.tsx — Beergate v3 Keezer Digital Twin + Flow Monitoring
import { useEffect, useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Beer, Thermometer, Gauge, Droplets, AlertTriangle,
  Settings, Plus, GlassWater, TrendingDown, Calendar,
} from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'
import KeezerTwin from '@/components/keezer/keezer-twin'
import TapDetail from '@/components/keezer/tap-detail'
import { MOCK_TAPS, KEG_MAP } from '@/data/kegs'
import type { TapConfig } from '@/data/kegs'

// ---- Keg quick-stat card ----

function KegQuickCard({ tap, selected, onClick }: {
  tap: TapConfig
  selected: boolean
  onClick: () => void
}) {
  const { t } = useTranslation('devices')
  const pct = tap.liters_total > 0 ? tap.liters_remaining / tap.liters_total : 0
  const isEmpty = tap.status === 'empty'
  const keg = KEG_MAP.get(tap.keg_type_id ?? '')

  const levelColor =
    pct > 0.5 ? '#7CB342' :
    pct > 0.2 ? '#F5A623' :
    pct > 0 ? '#EF5350' :
    '#3A4A5C'

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      style={{
        background: selected
          ? 'rgba(245,166,35,0.08)'
          : 'rgba(255,255,255,0.03)',
        border: selected
          ? '1px solid rgba(245,166,35,0.3)'
          : '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14,
        padding: 16,
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        transition: 'all 0.2s',
      }}
    >
      {/* Top: Tap number + alert */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: isEmpty ? 'rgba(90,107,128,0.15)' : 'rgba(245,166,35,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: isEmpty ? '#5A6B80' : '#F5A623',
            }}>
              {tap.id}
            </span>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 600, color: '#5A6B80',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            TAP {tap.id}
          </span>
        </div>
        {pct > 0 && pct < 0.2 && (
          <AlertTriangle size={14} color="#EF5350" />
        )}
      </div>

      {/* Beer name or empty */}
      <div style={{
        fontSize: 14, fontWeight: 600, color: '#E8E0D4',
        fontFamily: "'Space Grotesk', sans-serif",
        marginBottom: 4,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {tap.beer_name || t('empty_keg')}
      </div>

      {isEmpty ? (
        <div style={{ fontSize: 11, color: '#5A6B80' }}>
          {keg?.name || '—'}
        </div>
      ) : (
        <>
          <div style={{ fontSize: 11, color: '#8B9BB4', marginBottom: 8 }}>
            {tap.style} · {tap.abv}%
          </div>

          {/* Level bar */}
          <div style={{
            height: 6, borderRadius: 3,
            background: 'rgba(255,255,255,0.06)',
            overflow: 'hidden', marginBottom: 6,
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{
                height: '100%', borderRadius: 3,
                background: levelColor,
              }}
            />
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{
              fontSize: 11, color: '#8B9BB4',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {tap.liters_remaining.toFixed(1)}L
            </span>
            <span style={{ fontSize: 11, color: '#5A6B80' }}>
              <Thermometer size={11} style={{ verticalAlign: 'middle', marginRight: 2 }} />
              {tap.temperature.toFixed(1)}°
            </span>
            <span style={{ fontSize: 11, color: '#5A6B80' }}>
              <Gauge size={11} style={{ verticalAlign: 'middle', marginRight: 2 }} />
              {tap.pressure_bar.toFixed(1)}bar
            </span>
          </div>
        </>
      )}
    </motion.button>
  )
}

// ---- Summary Stats Strip ----

function StatsStrip({ taps }: { taps: TapConfig[] }) {
  const { t } = useTranslation('devices')

  const active = taps.filter(t => t.status === 'active')
  const totalLiters = active.reduce((s, t) => s + t.liters_remaining, 0)
  const avgTemp = active.length > 0
    ? active.reduce((s, t) => s + t.temperature, 0) / active.length
    : 0
  const totalServings = taps.reduce((s, t) => s + t.serving_count, 0)
  const lowCount = active.filter(t => t.liters_remaining / t.liters_total < 0.2).length

  const stats = [
    { icon: Beer, label: t('active_kegs'), value: active.length, unit: `/ ${taps.length}`, color: '#F5A623' },
    { icon: Droplets, label: t('total_volume', 'Volumen total'), value: totalLiters.toFixed(1), unit: 'L', color: '#42A5F5' },
    { icon: Thermometer, label: t('avg_temp', 'Temp. media'), value: avgTemp.toFixed(1), unit: '°C', color: '#7CB342' },
    { icon: GlassWater, label: t('total_servings', 'Servicios'), value: totalServings, unit: '', color: '#D4723C' },
  ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: 10,
    }}>
      {stats.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12,
            padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}
        >
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: `${s.color}12`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <s.icon size={16} color={s.color} />
          </div>
          <div>
            <div style={{
              fontSize: 18, fontWeight: 700, color: '#E8E0D4',
              fontFamily: "'Space Grotesk', sans-serif",
              lineHeight: 1.1,
            }}>
              {s.value}
              <span style={{ fontSize: 11, color: '#8B9BB4', marginLeft: 3 }}>{s.unit}</span>
            </div>
            <div style={{ fontSize: 10, color: '#5A6B80' }}>{s.label}</div>
          </div>
        </motion.div>
      ))}

      {/* Low warning */}
      {lowCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            background: 'rgba(239,83,80,0.08)',
            border: '1px solid rgba(239,83,80,0.2)',
            borderRadius: 12,
            padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}
        >
          <AlertTriangle size={16} color="#EF5350" />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#EF5350' }}>
              {lowCount} {t('low_alert', 'bajo')}
            </div>
            <div style={{ fontSize: 10, color: '#EF535099' }}>
              {t('running_low')}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// ---- Main Page ----

export default function KeezerPage() {
  const { t } = useTranslation(['common', 'devices'])
  const { setActivePage } = useUIStore()
  const [selectedTap, setSelectedTap] = useState<number | null>(null)

  useEffect(() => { setActivePage('keezer') }, [setActivePage])

  // In production this would come from a hook/API
  const taps: TapConfig[] = MOCK_TAPS

  const selectedTapData = useMemo(
    () => taps.find(t => t.id === selectedTap) ?? null,
    [taps, selectedTap]
  )

  const handleSelectTap = useCallback((id: number) => {
    setSelectedTap(prev => prev === id ? null : id)
  }, [])

  return (
    <div style={{ padding: '16px 24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Page header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: 20,
      }}>
        <div>
          <h1 style={{
            fontSize: 24, fontWeight: 700, color: '#E8E0D4', margin: 0,
            fontFamily: "'Space Grotesk', sans-serif",
          }}>
            🍻 {t('nav.keezer')}
          </h1>
          <p style={{ fontSize: 13, color: '#8B9BB4', margin: '4px 0 0' }}>
            {t('devices:keezer_subtitle')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, padding: '8px 14px', color: '#8B9BB4',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
          }}>
            <Settings size={14} />
            {t('devices:configure', 'Configurar')}
          </button>
          <button style={{
            background: 'linear-gradient(135deg, #F5A623 0%, #D4723C 100%)',
            border: 'none', borderRadius: 10, padding: '8px 14px', color: '#0A0E14',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, fontWeight: 600,
          }}>
            <Plus size={14} />
            {t('devices:add_tap', 'Añadir Tap')}
          </button>
        </div>
      </div>

      {/* Stats Strip */}
      <StatsStrip taps={taps} />

      {/* Main content: Twin + Detail panel */}
      <div style={{
        display: 'flex', gap: 20, marginTop: 20,
        flexDirection: 'row',
        alignItems: 'flex-start',
      }}>
        {/* Left: SVG Twin + Quick Cards */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Hero SVG Twin */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16,
              padding: '20px 16px',
              marginBottom: 16,
            }}
          >
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 8, padding: '0 8px',
            }}>
              <h2 style={{
                fontSize: 13, fontWeight: 600, color: '#8B9BB4',
                textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0,
              }}>
                {t('devices:digital_twin', 'Digital Twin')}
              </h2>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 11, color: '#42A5F5',
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                <Thermometer size={12} />
                {(taps.reduce((s, t) => s + t.temperature, 0) / taps.filter(t => t.status !== 'empty').length || 0).toFixed(1)}°C
              </div>
            </div>

            <KeezerTwin
              taps={taps}
              selectedTap={selectedTap}
              onSelectTap={handleSelectTap}
              keezerTemp={3.1}
            />

            {/* Tap instruction */}
            <p style={{
              textAlign: 'center', fontSize: 11, color: '#5A6B80',
              margin: '4px 0 0',
            }}>
              {t('devices:click_tap', 'Haz clic en un barril para ver los detalles')}
            </p>
          </motion.div>

          {/* Quick cards grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 10,
          }}>
            {taps.map((tap, i) => (
              <motion.div
                key={tap.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.06 }}
              >
                <KegQuickCard
                  tap={tap}
                  selected={selectedTap === tap.id}
                  onClick={() => handleSelectTap(tap.id)}
                />
              </motion.div>
            ))}
          </div>

          {/* Alerts strip */}
          {taps.some(t => t.status === 'active' && t.liters_remaining / t.liters_total < 0.35) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{
                marginTop: 16,
                background: 'rgba(245,166,35,0.06)',
                border: '1px solid rgba(245,166,35,0.15)',
                borderRadius: 12,
                padding: '12px 16px',
              }}
            >
              <div style={{
                fontSize: 12, fontWeight: 600, color: '#F5A623',
                marginBottom: 6,
              }}>
                💡 {t('devices:suggestions', 'Sugerencias')}
              </div>
              {taps
                .filter(t => t.status === 'active' && t.liters_remaining / t.liters_total < 0.35)
                .map(tap => (
                  <div key={tap.id} style={{
                    fontSize: 12, color: '#E8E0D4', marginBottom: 4,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <span style={{ color: '#F5A623' }}>⚠️</span>
                    Tap {tap.id} ({tap.beer_name}): {t('devices:consider_brewing', 'considera preparar más')} {tap.style}
                    — {t('devices:estimated', 'quedan')} ~{tap.days_remaining} {t('devices:days', 'días')}
                  </div>
                ))}
            </motion.div>
          )}
        </div>

        {/* Right: Tap Detail Panel */}
        <div style={{
          width: selectedTap ? 380 : 0,
          flexShrink: 0,
          transition: 'width 0.3s',
          overflow: 'hidden',
        }}>
          <TapDetail
            tap={selectedTapData}
            onClose={() => setSelectedTap(null)}
          />
        </div>
      </div>
    </div>
  )
}
