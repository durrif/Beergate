// frontend/src/components/ai/context-badge.tsx
import { useTranslation } from 'react-i18next'

interface ContextBadgeProps {
  page: string
}

const pageColors: Record<string, string> = {
  inventory: 'text-amber-400',
  brewing: 'text-orange-400',
  fermentation: 'text-blue-400',
  recipes: 'text-green-400',
  shop: 'text-purple-400',
  dashboard: 'text-text-secondary',
}

export function ContextBadge({ page }: ContextBadgeProps) {
  const { t } = useTranslation('ai')
  const color = pageColors[page] ?? pageColors['dashboard']
  const label = t(`context.${page}` as `context.${string}`, { defaultValue: `Context: ${page}` })

  return (
    <span className={`text-[10px] font-medium ${color}`}>{label}</span>
  )
}
