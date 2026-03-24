// src/components/fermentation/add-fermentation-modal.tsx — Add Manual Reading / New Fermentation
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Droplets, Thermometer, Calendar, FlaskConical, Wifi } from 'lucide-react'
import { toast } from 'sonner'

import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { useAddFermentationPoint } from '@/hooks/use-fermentation'
import { FERMENTER_CATALOG } from '@/data/fermenters'
import type { BrewSession } from '@/lib/types'

interface AddFermentationModalProps {
  open: boolean
  onClose: () => void
  /** If provided, adds a manual reading to this session */
  session?: BrewSession | null
}

export function AddFermentationModal({ open, onClose, session }: AddFermentationModalProps) {
  const { t } = useTranslation('common')

  const [gravity, setGravity] = useState('1.050')
  const [temperature, setTemperature] = useState('20.0')
  const [recordedAt, setRecordedAt] = useState(new Date().toISOString().slice(0, 16))
  const [source, setSource] = useState<'manual' | 'hydrometer' | 'refractometer'>('manual')
  const [selectedFermenter, setSelectedFermenter] = useState(FERMENTER_CATALOG[0]?.id ?? '')

  const sessionId = session ? Number(session.id) : 0
  const addPoint = useAddFermentationPoint(sessionId)

  const handleSubmit = () => {
    const sg = parseFloat(gravity)
    const temp = parseFloat(temperature)

    if (isNaN(sg) || sg < 0.990 || sg > 1.200) {
      toast.error('Densidad inválida (0.990–1.200)')
      return
    }
    if (isNaN(temp) || temp < -10 || temp > 50) {
      toast.error('Temperatura inválida (-10–50°C)')
      return
    }

    addPoint.mutate(
      {
        gravity: sg,
        temperature: temp,
        recorded_at: new Date(recordedAt).toISOString(),
        source,
      },
      {
        onSuccess: () => {
          toast.success('Lectura añadida')
          onClose()
        },
        onError: () => toast.error('Error al añadir lectura'),
      },
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={session ? 'Añadir lectura manual' : 'Nueva fermentación'}
      description={session ? `${session.name} — Registra una lectura de densidad/temperatura` : 'Configura un nuevo seguimiento de fermentación'}
      size="md"
    >
      <div className="space-y-5">
        {/* Fermenter selector (only when no session) */}
        {!session && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
              <FlaskConical size={12} />
              Fermentador
            </label>
            <select
              value={selectedFermenter}
              onChange={(e) => setSelectedFermenter(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-bg-elevated border border-white/10 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent-amber/50"
            >
              {FERMENTER_CATALOG.map(f => (
                <option key={f.id} value={f.id}>
                  {f.icon} {f.name} — {f.brand} ({f.capacity_liters}L)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Source selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <Wifi size={12} />
            Fuente
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['manual', 'hydrometer', 'refractometer'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSource(s)}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                  source === s
                    ? 'bg-accent-amber/15 text-accent-amber border-accent-amber/30'
                    : 'bg-bg-elevated text-text-secondary border-white/10 hover:border-white/20'
                }`}
              >
                {s === 'manual' ? 'Manual' : s === 'hydrometer' ? 'Hidrómetro' : 'Refractómetro'}
              </button>
            ))}
          </div>
        </div>

        {/* Gravity + Temperature row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
              <Droplets size={12} />
              Densidad (SG)
            </label>
            <input
              type="number"
              step="0.001"
              min="0.990"
              max="1.200"
              value={gravity}
              onChange={(e) => setGravity(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-bg-elevated border border-white/10 text-text-primary font-mono text-sm focus:outline-none focus:ring-1 focus:ring-accent-amber/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
              <Thermometer size={12} />
              Temperatura (°C)
            </label>
            <input
              type="number"
              step="0.1"
              min="-10"
              max="50"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-bg-elevated border border-white/10 text-text-primary font-mono text-sm focus:outline-none focus:ring-1 focus:ring-accent-amber/50"
            />
          </div>
        </div>

        {/* Date/time */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <Calendar size={12} />
            Fecha y hora
          </label>
          <input
            type="datetime-local"
            value={recordedAt}
            onChange={(e) => setRecordedAt(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-bg-elevated border border-white/10 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent-amber/50"
          />
        </div>

        {/* Preview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-bg-elevated rounded-xl border border-white/5 p-4 flex justify-between items-center"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-amber/10 flex items-center justify-center">
              <Droplets size={18} className="text-accent-amber" />
            </div>
            <div>
              <p className="text-sm font-mono font-bold text-text-primary">{gravity} SG</p>
              <p className="text-xs text-text-muted">{temperature}°C · {source}</p>
            </div>
          </div>
          <p className="text-xs text-text-tertiary">
            {new Date(recordedAt).toLocaleString()}
          </p>
        </motion.div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={addPoint.isPending || !session}
          className="w-full bg-accent-amber hover:bg-accent-amber-bright text-bg-primary font-bold py-3"
        >
          {addPoint.isPending ? 'Guardando...' : 'Registrar lectura'}
        </Button>
      </div>
    </Modal>
  )
}
