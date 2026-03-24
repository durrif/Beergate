// src/data/kegs.ts — Beergate v3 Keg Catalog & Keezer Configuration

export type ConnectorType = 'ball_lock' | 'pin_lock' | 'sankey_d' | 'sankey_s' | 'sankey_a'

export interface KegSpec {
  id: string
  name: string
  type: 'corny' | 'commercial' | 'mini'
  capacity_liters: number
  connector: ConnectorType
  material: 'stainless' | 'plastic'
  height_cm: number
  diameter_cm: number
  weight_empty_kg: number
  color: string
}

export interface TapConfig {
  id: number
  keg_type_id: string | null
  beer_name: string | null
  style: string | null
  abv: number | null
  og: number | null
  fg: number | null
  liters_remaining: number
  liters_total: number
  temperature: number
  pressure_bar: number
  co2_volumes: number
  tapped_date: string | null
  days_remaining: number | null
  consumption_rate_per_day: number
  color_hex: string
  status: 'active' | 'empty' | 'cleaning' | 'conditioning'
  serving_count: number
  last_pour: string | null
}

export const CONNECTOR_LABELS: Record<ConnectorType, string> = {
  ball_lock: 'Ball Lock',
  pin_lock: 'Pin Lock',
  sankey_d: 'Sankey D (Europe)',
  sankey_s: 'Sankey S (US)',
  sankey_a: 'Sankey A (German)',
}

export const CONNECTOR_ICONS: Record<ConnectorType, string> = {
  ball_lock: '🔵',
  pin_lock: '🔴',
  sankey_d: '⚪',
  sankey_s: '🟡',
  sankey_a: '🟠',
}

export const KEG_CATALOG: KegSpec[] = [
  {
    id: 'corny-19',
    name: 'Corny Keg 19L',
    type: 'corny',
    capacity_liters: 19,
    connector: 'ball_lock',
    material: 'stainless',
    height_cm: 63,
    diameter_cm: 22,
    weight_empty_kg: 4.0,
    color: '#8B9BB4',
  },
  {
    id: 'corny-9.5',
    name: 'Corny Keg 9.5L',
    type: 'corny',
    capacity_liters: 9.5,
    connector: 'ball_lock',
    material: 'stainless',
    height_cm: 36,
    diameter_cm: 22,
    weight_empty_kg: 2.8,
    color: '#7CB342',
  },
  {
    id: 'corny-pin-19',
    name: 'Corny Keg 19L (Pin Lock)',
    type: 'corny',
    capacity_liters: 19,
    connector: 'pin_lock',
    material: 'stainless',
    height_cm: 58,
    diameter_cm: 23,
    weight_empty_kg: 4.2,
    color: '#42A5F5',
  },
  {
    id: 'commercial-30',
    name: 'Barril Comercial 30L',
    type: 'commercial',
    capacity_liters: 30,
    connector: 'sankey_d',
    material: 'stainless',
    height_cm: 40,
    diameter_cm: 38,
    weight_empty_kg: 9.5,
    color: '#D4723C',
  },
  {
    id: 'commercial-50',
    name: 'Barril Comercial 50L',
    type: 'commercial',
    capacity_liters: 50,
    connector: 'sankey_d',
    material: 'stainless',
    height_cm: 60,
    diameter_cm: 38,
    weight_empty_kg: 13.5,
    color: '#F5A623',
  },
  {
    id: 'mini-5',
    name: 'Mini Keg 5L',
    type: 'mini',
    capacity_liters: 5,
    connector: 'ball_lock',
    material: 'stainless',
    height_cm: 27,
    diameter_cm: 17,
    weight_empty_kg: 1.5,
    color: '#AB47BC',
  },
]

export const KEG_MAP = new Map(KEG_CATALOG.map(k => [k.id, k]))

// --- Mock tap data for demo ---
export const MOCK_TAPS: TapConfig[] = [
  {
    id: 1,
    keg_type_id: 'corny-19',
    beer_name: 'West Coast IPA',
    style: 'American IPA',
    abv: 6.8,
    og: 1.065,
    fg: 1.012,
    liters_remaining: 17.2,
    liters_total: 19,
    temperature: 3.1,
    pressure_bar: 1.2,
    co2_volumes: 2.4,
    tapped_date: '2026-03-11',
    days_remaining: 12,
    consumption_rate_per_day: 1.4,
    color_hex: '#D4923A',
    status: 'active',
    serving_count: 14,
    last_pour: '2026-03-23T14:30:00',
  },
  {
    id: 2,
    keg_type_id: 'corny-19',
    beer_name: 'Dry Stout',
    style: 'Irish Stout',
    abv: 4.5,
    og: 1.042,
    fg: 1.010,
    liters_remaining: 14.8,
    liters_total: 19,
    temperature: 3.0,
    pressure_bar: 1.1,
    co2_volumes: 2.1,
    tapped_date: '2026-03-14',
    days_remaining: 9,
    consumption_rate_per_day: 1.6,
    color_hex: '#2C1810',
    status: 'active',
    serving_count: 22,
    last_pour: '2026-03-23T12:15:00',
  },
  {
    id: 3,
    keg_type_id: 'corny-9.5',
    beer_name: 'Session Pale Ale',
    style: 'American Pale Ale',
    abv: 4.2,
    og: 1.040,
    fg: 1.008,
    liters_remaining: 3.1,
    liters_total: 9.5,
    temperature: 3.2,
    pressure_bar: 1.3,
    co2_volumes: 2.6,
    tapped_date: '2026-03-05',
    days_remaining: 2,
    consumption_rate_per_day: 1.8,
    color_hex: '#C68B3F',
    status: 'active',
    serving_count: 38,
    last_pour: '2026-03-23T18:45:00',
  },
  {
    id: 4,
    keg_type_id: 'corny-19',
    beer_name: null,
    style: null,
    abv: null,
    og: null,
    fg: null,
    liters_remaining: 0,
    liters_total: 19,
    temperature: 3.1,
    pressure_bar: 0,
    co2_volumes: 0,
    tapped_date: null,
    days_remaining: null,
    consumption_rate_per_day: 0,
    color_hex: '#3A4A5C',
    status: 'empty',
    serving_count: 0,
    last_pour: null,
  },
]

/** SRM-to-hex approximation for beer color display */
export function srmToHex(srm: number): string {
  const map: [number, string][] = [
    [2, '#F8F753'], [3, '#F6F513'], [4, '#ECE710'], [5, '#D5C909'],
    [6, '#C1B404'], [8, '#A89101'], [10, '#8F7500'], [12, '#7C6200'],
    [14, '#6B5200'], [17, '#584000'], [20, '#482F00'], [24, '#3A2300'],
    [29, '#2C1810'], [35, '#1F0E05'], [40, '#0F0500'],
  ]
  for (const [s, hex] of map) if (srm <= s) return hex
  return '#0A0200'
}

/** Carbonation vol → serving pressure at temperature (simplified) */
export function co2ToPsi(volumes: number, tempC: number): number {
  // Simplified formula: PSI ≈ -16.6999 - 0.0101059*T + 0.00116512*T² + 0.173354*T*V + 4.24267*V - 0.0684226*V²
  // where T = °F and V = volumes
  const tF = tempC * 9 / 5 + 32
  return Math.max(0, -16.6999 - 0.0101059 * tF + 0.00116512 * tF * tF
    + 0.173354 * tF * volumes + 4.24267 * volumes - 0.0684226 * volumes * volumes)
}
