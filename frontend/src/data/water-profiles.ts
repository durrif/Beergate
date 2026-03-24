// frontend/src/data/water-profiles.ts — Complete water profiles database for Beergate v4

export interface WaterProfile {
  id: string
  name: string
  region: string
  country: string
  countryFlag: string
  type: 'famous_brewing' | 'city_tap' | 'mineral_bottled' | 'style_target'
  calcium: number       // Ca  (ppm)
  magnesium: number     // Mg  (ppm)
  sodium: number        // Na  (ppm)
  chloride: number      // Cl  (ppm)
  sulfate: number       // SO4 (ppm)
  bicarbonate: number   // HCO3 (ppm)
  pH?: number
  source?: string
  bestFor?: string
}

export interface SaltAddition {
  id: string
  name: string
  formula: string
  /** ppm contribution per gram per liter for each ion */
  calcium: number
  magnesium: number
  sodium: number
  chloride: number
  sulfate: number
  bicarbonate: number
}

/* ── Famous Brewing Waters ──────────────────────────────────── */
const FAMOUS_BREWING: WaterProfile[] = [
  { id: 'burton', name: 'Burton-on-Trent', region: 'Staffordshire', country: 'UK', countryFlag: '🇬🇧', type: 'famous_brewing', calcium: 295, magnesium: 45, sodium: 55, chloride: 25, sulfate: 725, bicarbonate: 300, bestFor: 'English IPA, Pale Ale' },
  { id: 'dublin', name: 'Dublin', region: 'Leinster', country: 'Ireland', countryFlag: '🇮🇪', type: 'famous_brewing', calcium: 118, magnesium: 4, sodium: 12, chloride: 19, sulfate: 54, bicarbonate: 319, bestFor: 'Stout, Porter' },
  { id: 'pilsen', name: 'Pilsen', region: 'Bohemia', country: 'Czech Republic', countryFlag: '🇨🇿', type: 'famous_brewing', calcium: 7, magnesium: 2, sodium: 2, chloride: 5, sulfate: 5, bicarbonate: 14, bestFor: 'Pilsner, Light Lager' },
  { id: 'munich', name: 'Munich', region: 'Bavaria', country: 'Germany', countryFlag: '🇩🇪', type: 'famous_brewing', calcium: 76, magnesium: 18, sodium: 2, chloride: 2, sulfate: 10, bicarbonate: 152, bestFor: 'Dark Lager, Bock' },
  { id: 'vienna', name: 'Vienna', region: 'Vienna', country: 'Austria', countryFlag: '🇦🇹', type: 'famous_brewing', calcium: 163, magnesium: 68, sodium: 8, chloride: 12, sulfate: 216, bicarbonate: 243, bestFor: 'Vienna Lager, Märzen' },
  { id: 'london', name: 'London', region: 'Greater London', country: 'UK', countryFlag: '🇬🇧', type: 'famous_brewing', calcium: 52, magnesium: 32, sodium: 86, chloride: 34, sulfate: 32, bicarbonate: 104, bestFor: 'Porter, Brown Ale' },
  { id: 'dortmund', name: 'Dortmund', region: 'NRW', country: 'Germany', countryFlag: '🇩🇪', type: 'famous_brewing', calcium: 225, magnesium: 40, sodium: 60, chloride: 60, sulfate: 120, bicarbonate: 220, bestFor: 'Export Lager' },
  { id: 'edinburgh', name: 'Edinburgh', region: 'Scotland', country: 'UK', countryFlag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', type: 'famous_brewing', calcium: 120, magnesium: 25, sodium: 55, chloride: 65, sulfate: 140, bicarbonate: 225, bestFor: 'Scottish Ale' },
  { id: 'prague', name: 'Prague', region: 'Central Bohemia', country: 'Czech Republic', countryFlag: '🇨🇿', type: 'famous_brewing', calcium: 30, magnesium: 6, sodium: 3, chloride: 5, sulfate: 30, bicarbonate: 75, bestFor: 'Czech Pilsner' },
  { id: 'cologne', name: 'Cologne', region: 'NRW', country: 'Germany', countryFlag: '🇩🇪', type: 'famous_brewing', calcium: 80, magnesium: 6, sodium: 8, chloride: 14, sulfate: 50, bicarbonate: 150, bestFor: 'Kölsch' },
  { id: 'la-coruna', name: 'La Coruña', region: 'Galicia', country: 'Spain', countryFlag: '🇪🇸', type: 'famous_brewing', calcium: 8, magnesium: 2, sodium: 12, chloride: 18, sulfate: 8, bicarbonate: 25, bestFor: 'Soft water styles' },
]

/* ── Spanish City Tap Water ─────────────────────────────────── */
const SPANISH_TAP: WaterProfile[] = [
  { id: 'madrid', name: 'Madrid', region: 'Comunidad de Madrid', country: 'Spain', countryFlag: '🇪🇸', type: 'city_tap', calcium: 15, magnesium: 2, sodium: 8, chloride: 12, sulfate: 10, bicarbonate: 30, source: 'canaldeisabelsegunda.es' },
  { id: 'barcelona', name: 'Barcelona', region: 'Cataluña', country: 'Spain', countryFlag: '🇪🇸', type: 'city_tap', calcium: 85, magnesium: 22, sodium: 65, chloride: 105, sulfate: 120, bicarbonate: 220, source: 'aiguesdebarcelona.cat' },
  { id: 'segovia', name: 'Segovia', region: 'Castilla y León', country: 'Spain', countryFlag: '🇪🇸', type: 'city_tap', calcium: 12, magnesium: 3, sodium: 5, chloride: 8, sulfate: 6, bicarbonate: 22, source: 'Municipal data' },
  { id: 'valencia', name: 'Valencia', region: 'Comunitat Valenciana', country: 'Spain', countryFlag: '🇪🇸', type: 'city_tap', calcium: 95, magnesium: 30, sodium: 40, chloride: 70, sulfate: 150, bicarbonate: 250, source: 'emivasa.es' },
  { id: 'bilbao', name: 'Bilbao', region: 'País Vasco', country: 'Spain', countryFlag: '🇪🇸', type: 'city_tap', calcium: 20, magnesium: 4, sodium: 10, chloride: 15, sulfate: 12, bicarbonate: 45, source: 'consorcioaguas.eus' },
  { id: 'sevilla', name: 'Sevilla', region: 'Andalucía', country: 'Spain', countryFlag: '🇪🇸', type: 'city_tap', calcium: 75, magnesium: 20, sodium: 35, chloride: 55, sulfate: 90, bicarbonate: 180, source: 'emasesa.com' },
  { id: 'granada', name: 'Granada', region: 'Andalucía', country: 'Spain', countryFlag: '🇪🇸', type: 'city_tap', calcium: 45, magnesium: 12, sodium: 8, chloride: 10, sulfate: 25, bicarbonate: 120, source: 'emasagra.es' },
  { id: 'zaragoza', name: 'Zaragoza', region: 'Aragón', country: 'Spain', countryFlag: '🇪🇸', type: 'city_tap', calcium: 80, magnesium: 25, sodium: 30, chloride: 45, sulfate: 100, bicarbonate: 200, source: 'ecociudad.es' },
]

/* ── Spanish Bottled Mineral Waters ─────────────────────────── */
const BOTTLED_MINERAL: WaterProfile[] = [
  { id: 'bezoya', name: 'Bezoya', region: 'Segovia', country: 'Spain', countryFlag: '🇪🇸', type: 'mineral_bottled', calcium: 1.6, magnesium: 0.3, sodium: 1.8, chloride: 0.5, sulfate: 0.5, bicarbonate: 6.7, bestFor: 'Ultra-soft base water' },
  { id: 'font-vella', name: 'Font Vella', region: 'Girona', country: 'Spain', countryFlag: '🇪🇸', type: 'mineral_bottled', calcium: 38, magnesium: 9.7, sodium: 12, chloride: 12, sulfate: 12, bicarbonate: 148, bestFor: 'Medium mineralization base' },
  { id: 'lanjaron', name: 'Lanjarón', region: 'Granada', country: 'Spain', countryFlag: '🇪🇸', type: 'mineral_bottled', calcium: 27, magnesium: 8.8, sodium: 4.8, chloride: 3.4, sulfate: 7.5, bicarbonate: 105, bestFor: 'Low sodium base' },
  { id: 'solan-cabras', name: 'Solán de Cabras', region: 'Cuenca', country: 'Spain', countryFlag: '🇪🇸', type: 'mineral_bottled', calcium: 60, magnesium: 25, sodium: 5, chloride: 7, sulfate: 18, bicarbonate: 285, bestFor: 'High Ca/Mg' },
  { id: 'veri', name: 'Veri', region: 'Lleida', country: 'Spain', countryFlag: '🇪🇸', type: 'mineral_bottled', calcium: 36, magnesium: 1.2, sodium: 0.6, chloride: 0.3, sulfate: 3.5, bicarbonate: 112, bestFor: 'Very clean profile' },
  { id: 'vilas-turbon', name: 'Vilas del Turbón', region: 'Huesca', country: 'Spain', countryFlag: '🇪🇸', type: 'mineral_bottled', calcium: 73, magnesium: 33, sodium: 1.9, chloride: 0.4, sulfate: 15, bicarbonate: 357, bestFor: 'High bicarbonate' },
]

/* ── Combined Database ──────────────────────────────────────── */
export const WATER_PROFILES: WaterProfile[] = [
  ...FAMOUS_BREWING,
  ...SPANISH_TAP,
  ...BOTTLED_MINERAL,
]

export const WATER_PROFILES_MAP: Record<string, WaterProfile> = Object.fromEntries(
  WATER_PROFILES.map((p) => [p.id, p]),
)

/* ── Distilled / RO Water baseline ──────────────────────────── */
export const RO_WATER: WaterProfile = {
  id: 'ro',
  name: 'Agua destilada / RO',
  region: '',
  country: '',
  countryFlag: '🧪',
  type: 'style_target',
  calcium: 0,
  magnesium: 0,
  sodium: 0,
  chloride: 0,
  sulfate: 0,
  bicarbonate: 0,
}

/* ── Brewing Salts ──────────────────────────────────────────── */
/** All values: ppm per gram per liter of water */
export const BREWING_SALTS: SaltAddition[] = [
  { id: 'gypsum',    name: 'Yeso (CaSO₄·2H₂O)',             formula: 'CaSO₄·2H₂O',  calcium: 61.5,  magnesium: 0,     sodium: 0,     chloride: 0,      sulfate: 147.4,  bicarbonate: 0 },
  { id: 'cacl2',     name: 'Cloruro de Calcio (CaCl₂·2H₂O)', formula: 'CaCl₂·2H₂O',  calcium: 72.0,  magnesium: 0,     sodium: 0,     chloride: 127.4,  sulfate: 0,      bicarbonate: 0 },
  { id: 'epsom',     name: 'Sal de Epsom (MgSO₄·7H₂O)',      formula: 'MgSO₄·7H₂O',  calcium: 0,     magnesium: 26.1,  sodium: 0,     chloride: 0,      sulfate: 103.0,  bicarbonate: 0 },
  { id: 'nahco3',    name: 'Bicarbonato de sodio (NaHCO₃)',   formula: 'NaHCO₃',       calcium: 0,     magnesium: 0,     sodium: 72.3,  chloride: 0,      sulfate: 0,      bicarbonate: 191.9 },
  { id: 'chalk',     name: 'Carbonato de calcio (CaCO₃)',     formula: 'CaCO₃',        calcium: 105.8, magnesium: 0,     sodium: 0,     chloride: 0,      sulfate: 0,      bicarbonate: 321.8 },
  { id: 'nacl',      name: 'Sal de mesa (NaCl)',              formula: 'NaCl',          calcium: 0,     magnesium: 0,     sodium: 104.0, chloride: 160.3,  sulfate: 0,      bicarbonate: 0 },
  { id: 'mgcl2',     name: 'Cloruro de magnesio (MgCl₂·6H₂O)', formula: 'MgCl₂·6H₂O', calcium: 0,    magnesium: 31.6,  sodium: 0,     chloride: 91.8,   sulfate: 0,      bicarbonate: 0 },
]

/* ── Ion labels for UI ──────────────────────────────────────── */
export const ION_LABELS: Record<string, { label: string; unit: string; color: string }> = {
  calcium:     { label: 'Ca²⁺',   unit: 'ppm', color: '#F5A623' },
  magnesium:   { label: 'Mg²⁺',   unit: 'ppm', color: '#7CB342' },
  sodium:      { label: 'Na⁺',    unit: 'ppm', color: '#42A5F5' },
  chloride:    { label: 'Cl⁻',    unit: 'ppm', color: '#9C6ADE' },
  sulfate:     { label: 'SO₄²⁻',  unit: 'ppm', color: '#D4723C' },
  bicarbonate: { label: 'HCO₃⁻',  unit: 'ppm', color: '#8B9BB4' },
}

export const ION_KEYS = ['calcium', 'magnesium', 'sodium', 'chloride', 'sulfate', 'bicarbonate'] as const
export type IonKey = (typeof ION_KEYS)[number]
