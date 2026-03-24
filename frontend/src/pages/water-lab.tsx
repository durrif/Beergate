// frontend/src/pages/water-lab.tsx — Beergate v4 FASE 2
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Droplets, RotateCcw, Beaker } from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'
import { useWaterStore } from '@/stores/water-store'
import { WaterProfileSelector } from '@/components/water/water-profile-selector'
import { SaltAdditions } from '@/components/water/salt-additions'
import { ClSO4Ratio } from '@/components/water/cl-so4-ratio'
import { MashPHEstimator } from '@/components/water/mash-ph-estimator'
import { AcidCalculator } from '@/components/water/acid-calculator'
import { DilutionCalculator } from '@/components/water/dilution-calculator'
import { WaterComparisonChart } from '@/components/water/water-comparison-chart'

export default function WaterLabPage() {
  const { t } = useTranslation('common')
  const setActivePage = useUIStore((s) => s.setActivePage)
  const {
    sourceProfileId, targetProfileId,
    customSource, customTarget,
    setSourceProfile, setTargetProfile,
    setCustomSource, setCustomTarget,
    resetAll,
  } = useWaterStore()

  useEffect(() => { setActivePage('water_lab') }, [setActivePage])

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header__title flex items-center gap-3">
            <Droplets className="text-accent-info" size={28} />
            {t('nav.water_lab')}
          </h1>
          <p className="page-header__subtitle">
            Perfiles de agua mundiales, aguas españolas, calculadora de sales, pH del macerado y ratio Cl/SO₄
          </p>
        </div>
        <button
          onClick={resetAll}
          className="flex items-center gap-1.5 px-3 py-2 text-xs text-text-tertiary hover:text-text-secondary bg-bg-tertiary hover:bg-bg-tertiary/80 rounded-lg transition-colors"
        >
          <RotateCcw size={14} />
          Resetear todo
        </button>
      </div>

      {/* Step 1: Source + Target water profiles side by side */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Beaker size={16} className="text-accent-amber" />
          <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
            1. Selecciona tus aguas
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <WaterProfileSelector
            label="💧 Agua de origen"
            selectedId={sourceProfileId}
            customIons={customSource}
            onSelectProfile={setSourceProfile}
            onSetCustom={setCustomSource}
          />
          <WaterProfileSelector
            label="🎯 Agua objetivo"
            selectedId={targetProfileId}
            customIons={customTarget}
            onSelectProfile={setTargetProfile}
            onSetCustom={setCustomTarget}
          />
        </div>
      </section>

      {/* Step 2: Dilution */}
      <section>
        <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-3">
          2. Dilución (opcional)
        </h2>
        <DilutionCalculator />
      </section>

      {/* Step 3: Salt Additions + Cl/SO4 ratio */}
      <section>
        <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-3">
          3. Adición de sales
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <SaltAdditions />
          <ClSO4Ratio />
        </div>
      </section>

      {/* Step 4: pH + Acid */}
      <section>
        <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-3">
          4. pH del macerado
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <MashPHEstimator />
          <AcidCalculator />
        </div>
      </section>

      {/* Step 5: Comparison Chart */}
      <section>
        <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-3">
          5. Comparación visual
        </h2>
        <WaterComparisonChart />
      </section>
    </div>
  )
}
