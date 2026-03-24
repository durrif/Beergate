// frontend/src/components/water/acid-calculator.tsx — Beergate v4

import { useState } from 'react'
import { useWaterStore } from '@/stores/water-store'
import { ACID_TYPES, calcAcidAddition, type AcidType } from '@/lib/water-calc'

export function AcidCalculator() {
  const { getEstimatedPH, targetPH, getAdjustedWater, mashVolume } = useWaterStore()
  const firstAcid = ACID_TYPES[0] as AcidType
  const [selectedAcidId, setSelectedAcidId] = useState(firstAcid.id)

  const estimatedPH = getEstimatedPH()
  const adjusted = getAdjustedWater()
  const selectedAcid = ACID_TYPES.find((a) => a.id === selectedAcidId) ?? firstAcid
  const mlNeeded = calcAcidAddition(estimatedPH, targetPH, adjusted, mashVolume, selectedAcid)
  const needsAcid = estimatedPH > targetPH + 0.05

  return (
    <div className="glass-card rounded-xl p-4">
      <h3 className="text-sm font-semibold text-text-primary mb-1">
        Adición de ácido
      </h3>
      <p className="text-[10px] text-text-tertiary mb-4">
        Para bajar el pH del macerado al objetivo
      </p>

      {/* Acid type selector */}
      <div className="space-y-1 mb-4">
        {ACID_TYPES.map((acid) => (
          <button
            key={acid.id}
            onClick={() => setSelectedAcidId(acid.id)}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
              selectedAcidId === acid.id
                ? 'bg-accent-amber/15 border border-accent-amber/30 text-text-primary'
                : 'bg-bg-deep/50 border border-transparent text-text-secondary hover:bg-bg-tertiary'
            }`}
          >
            <div className="font-medium">{acid.name}</div>
            <div className="text-[10px] text-text-tertiary mt-0.5">
              Concentración: {(acid.concentration * 100).toFixed(0)}%
            </div>
          </button>
        ))}
      </div>

      {/* Result */}
      <div className="bg-bg-deep/50 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-text-secondary">pH actual → objetivo</span>
          <span className="text-xs font-mono text-text-primary">
            {estimatedPH.toFixed(2)} → {targetPH.toFixed(2)}
          </span>
        </div>

        {needsAcid ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">Añadir</span>
              <span className="text-lg font-mono font-bold text-accent-amber">
                {mlNeeded.toFixed(1)} mL
              </span>
            </div>
            <div className="text-[10px] text-text-tertiary mt-1">
              de {selectedAcid.name} al macerado ({mashVolume} L)
            </div>
          </>
        ) : (
          <div className="text-[10px] text-status-success bg-status-success/10 p-2 rounded-lg">
            ✅ No se necesita ácido. El pH está en el rango objetivo.
          </div>
        )}
      </div>

      {/* Tip */}
      <div className="mt-3 text-[10px] text-text-tertiary bg-bg-deep/30 rounded-lg p-2">
        💡 <strong>Consejo:</strong> Añade el ácido poco a poco y mide el pH real con un medidor digital.
        Estos cálculos son estimaciones — siempre verifica antes de ajustar más.
      </div>
    </div>
  )
}
