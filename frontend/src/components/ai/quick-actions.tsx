// frontend/src/components/ai/quick-actions.tsx
import { useTranslation } from 'react-i18next'

interface QuickActionsProps {
  page: string
  onSelect: (text: string) => void
}

export function QuickActions({ page, onSelect }: QuickActionsProps) {
  const { t } = useTranslation('ai')

  const key = ['inventory', 'brewing', 'fermentation', 'shop'].includes(page) ? page : 'default'
  const actions = t(`quick_actions.${key}`, { returnObjects: true }) as string[]

  if (!Array.isArray(actions) || actions.length === 0) return null

  return (
    <div className="px-4 pb-2 flex flex-wrap gap-2">
      {actions.map((action) => (
        <button
          key={action}
          onClick={() => onSelect(action)}
          className="text-xs px-3 py-1.5 rounded-full glass-card border border-accent-amber/20 text-text-secondary hover:text-accent-amber hover:border-accent-amber/50 transition-all"
        >
          {action}
        </button>
      ))}
    </div>
  )
}
