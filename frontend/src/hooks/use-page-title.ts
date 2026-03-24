import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const PAGE_TITLE_KEYS: Record<string, string> = {
  dashboard: 'nav.dashboard',
  inventory: 'nav.inventory',
  brewing: 'nav.brewing',
  fermentation: 'nav.fermentation',
  recipes: 'nav.recipes',
  procurement: 'nav.procurement',
  devices: 'nav.devices',
  keezer: 'nav.keezer',
  analytics: 'nav.analytics',
  'ai-chat': 'nav.ai_chat',
  settings: 'nav.settings',
  suppliers: 'nav.suppliers',
  'water-lab': 'nav.water_lab',
  'pool-buying': 'nav.pool_buying',
  'brew-academy': 'nav.brew_academy',
  'avatar-config': 'nav.avatar_config',
}

export function usePageTitle(pageId: string) {
  const { t } = useTranslation('common')

  useEffect(() => {
    const key = PAGE_TITLE_KEYS[pageId]
    const title = key ? t(key) : pageId
    document.title = `${title} — Beergate`
  }, [pageId, t])
}
