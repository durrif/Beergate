// src/data/suppliers.ts — Spanish & European homebrew supplier database

export interface SupplierInfo {
  id: string
  name: string
  country: 'ES' | 'UK' | 'BE' | 'DE' | 'FR' | 'NL' | 'IT'
  url: string
  logo?: string
  /** Free shipping threshold in € (null = never free) */
  freeShippingThreshold: number | null
  /** Base shipping cost in € */
  baseShipping: number
  /** Estimated delivery days */
  deliveryDays: [number, number]
  /** Currency used */
  currency: 'EUR' | 'GBP'
  /** Specialty categories */
  specialties: string[]
  /** Overall rating 1-5 */
  rating: number
  /** Whether the scraper is active for this supplier */
  scraperActive: boolean
  /** Color for UI display */
  color: string
}

export const SUPPLIER_DATABASE: SupplierInfo[] = [
  // ── Spanish Suppliers ──
  {
    id: 'latiendadelcervecero',
    name: 'La Tienda del Cervecero',
    country: 'ES',
    url: 'https://www.latiendadelcervecero.com',
    freeShippingThreshold: 60,
    baseShipping: 4.95,
    deliveryDays: [2, 4],
    currency: 'EUR',
    specialties: ['maltas', 'lúpulos', 'levaduras', 'equipamiento'],
    rating: 4.5,
    scraperActive: true,
    color: '#E67E22',
  },
  {
    id: 'cervezania',
    name: 'Cervezanía',
    country: 'ES',
    url: 'https://www.cervezania.com',
    freeShippingThreshold: 50,
    baseShipping: 5.50,
    deliveryDays: [2, 5],
    currency: 'EUR',
    specialties: ['kits', 'ingredientes', 'maltas', 'lúpulos'],
    rating: 4.3,
    scraperActive: true,
    color: '#2ECC71',
  },
  {
    id: 'todograno',
    name: 'Todo Grano',
    country: 'ES',
    url: 'https://www.todograno.com',
    freeShippingThreshold: 60,
    baseShipping: 5.95,
    deliveryDays: [3, 5],
    currency: 'EUR',
    specialties: ['ingredientes', 'all-grain', 'maltas'],
    rating: 4.2,
    scraperActive: true,
    color: '#8E44AD',
  },
  {
    id: 'brewhub',
    name: 'Brew & Hub',
    country: 'ES',
    url: 'https://www.brewhub.es',
    freeShippingThreshold: 55,
    baseShipping: 4.50,
    deliveryDays: [2, 4],
    currency: 'EUR',
    specialties: ['lúpulos', 'levaduras', 'adjuntos'],
    rating: 4.0,
    scraperActive: true,
    color: '#3498DB',
  },
  {
    id: 'cocinista',
    name: 'Cocinista',
    country: 'ES',
    url: 'https://www.cocinista.es',
    freeShippingThreshold: 40,
    baseShipping: 4.50,
    deliveryDays: [2, 4],
    currency: 'EUR',
    specialties: ['ingredientes', 'saborizantes', 'adjuntos'],
    rating: 3.8,
    scraperActive: true,
    color: '#E74C3C',
  },

  // ── European Suppliers ──
  {
    id: 'themaltmiller',
    name: 'The Malt Miller',
    country: 'UK',
    url: 'https://www.themaltmiller.co.uk',
    freeShippingThreshold: null,
    baseShipping: 12.00,
    deliveryDays: [5, 10],
    currency: 'GBP',
    specialties: ['maltas', 'lúpulos', 'levaduras', 'equipamiento'],
    rating: 4.7,
    scraperActive: true,
    color: '#1ABC9C',
  },
  {
    id: 'brouwland',
    name: 'Brouwland',
    country: 'BE',
    url: 'https://www.brouwland.com',
    freeShippingThreshold: 100,
    baseShipping: 8.00,
    deliveryDays: [4, 8],
    currency: 'EUR',
    specialties: ['equipamiento', 'maltas', 'lúpulos', 'fermentación'],
    rating: 4.6,
    scraperActive: true,
    color: '#F39C12',
  },
  {
    id: 'hobbybrauerversand',
    name: 'Hobbybrauerversand',
    country: 'DE',
    url: 'https://www.hobbybrauerversand.de',
    freeShippingThreshold: 80,
    baseShipping: 10.00,
    deliveryDays: [5, 9],
    currency: 'EUR',
    specialties: ['maltas alemanas', 'equipamiento', 'lúpulos'],
    rating: 4.4,
    scraperActive: true,
    color: '#27AE60',
  },
  {
    id: 'hopandbrew',
    name: 'Hop and Brew',
    country: 'DE',
    url: 'https://www.hopandbrew.de',
    freeShippingThreshold: 75,
    baseShipping: 9.50,
    deliveryDays: [5, 9],
    currency: 'EUR',
    specialties: ['lúpulos', 'levaduras', 'ingredientes'],
    rating: 4.3,
    scraperActive: true,
    color: '#16A085',
  },
  {
    id: 'castlemalting',
    name: 'Castle Malting',
    country: 'BE',
    url: 'https://www.castlemalting.com',
    freeShippingThreshold: null,
    baseShipping: 15.00,
    deliveryDays: [7, 14],
    currency: 'EUR',
    specialties: ['maltas', 'maltas especiales', 'granel'],
    rating: 4.5,
    scraperActive: false,
    color: '#D35400',
  },
]

export const SUPPLIER_MAP = new Map(SUPPLIER_DATABASE.map(s => [s.id, s]))

export const SUPPLIER_COUNTRIES = [...new Set(SUPPLIER_DATABASE.map(s => s.country))]

export const COUNTRY_FLAGS: Record<string, string> = {
  ES: '🇪🇸',
  UK: '🇬🇧',
  BE: '🇧🇪',
  DE: '🇩🇪',
  FR: '🇫🇷',
  NL: '🇳🇱',
  IT: '🇮🇹',
}

export const COUNTRY_NAMES: Record<string, string> = {
  ES: 'España',
  UK: 'Reino Unido',
  BE: 'Bélgica',
  DE: 'Alemania',
  FR: 'Francia',
  NL: 'Países Bajos',
  IT: 'Italia',
}

/** Calculate total cost including shipping for a given order total at a supplier */
export function calcTotalWithShipping(supplier: SupplierInfo, orderSubtotal: number): number {
  if (supplier.freeShippingThreshold && orderSubtotal >= supplier.freeShippingThreshold) {
    return orderSubtotal
  }
  return orderSubtotal + supplier.baseShipping
}

/** How much more needed for free shipping? */
export function amountToFreeShipping(supplier: SupplierInfo, currentTotal: number): number | null {
  if (!supplier.freeShippingThreshold) return null
  const diff = supplier.freeShippingThreshold - currentTotal
  return diff > 0 ? diff : 0
}
