// frontend/src/lib/i18n.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Locales — imported statically for simplicity (Vite will bundle them)
import esCommon from '../locales/es/common.json'
import esInventory from '../locales/es/inventory.json'
import esBrewing from '../locales/es/brewing.json'
import esRecipes from '../locales/es/recipes.json'
import esAi from '../locales/es/ai.json'
import esShop from '../locales/es/shop.json'

import enCommon from '../locales/en/common.json'
import enInventory from '../locales/en/inventory.json'
import enBrewing from '../locales/en/brewing.json'
import enRecipes from '../locales/en/recipes.json'
import enAi from '../locales/en/ai.json'
import enShop from '../locales/en/shop.json'

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: {
        common: esCommon,
        inventory: esInventory,
        brewing: esBrewing,
        recipes: esRecipes,
        ai: esAi,
        shop: esShop,
      },
      en: {
        common: enCommon,
        inventory: enInventory,
        brewing: enBrewing,
        recipes: enRecipes,
        ai: enAi,
        shop: enShop,
      },
    },
    lng: 'es',
    fallbackLng: 'es',
    defaultNS: 'common',
    ns: ['common', 'inventory', 'brewing', 'recipes', 'ai', 'shop'],
    interpolation: {
      escapeValue: false, // React handles XSS
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'beergate_lang',
    },
  })

export default i18n
