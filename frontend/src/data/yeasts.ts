// frontend/src/data/yeasts.ts — Comprehensive yeast database for Beergate v3 Recipe Calculator

export interface YeastSpec {
  id: string
  name: string
  brand: string
  strain?: string
  form: 'dry' | 'liquid'
  attenuation_min: number    // %
  attenuation_max: number
  flocculation: 'low' | 'medium' | 'medium-high' | 'high' | 'very high'
  temp_min: number           // °C
  temp_max: number
  alcohol_tolerance_pct: number
  flavor: string
  styles: string[]           // best suited styles
}

export const YEAST_DATABASE: YeastSpec[] = [
  // ── Fermentis (Dry) ───────────────────────────────────────
  { id: 'fermentis-us05', name: 'Safale US-05', brand: 'Fermentis', strain: 'US-05', form: 'dry', attenuation_min: 78, attenuation_max: 82, flocculation: 'medium', temp_min: 15, temp_max: 24, alcohol_tolerance_pct: 11, flavor: 'Clean, neutral American ale, very versatile', styles: ['American Pale Ale', 'IPA', 'American Wheat', 'Blonde Ale'] },
  { id: 'fermentis-s04', name: 'Safale S-04', brand: 'Fermentis', strain: 'S-04', form: 'dry', attenuation_min: 72, attenuation_max: 78, flocculation: 'high', temp_min: 15, temp_max: 24, alcohol_tolerance_pct: 11, flavor: 'Clean English ale, slight fruity esters', styles: ['English Bitter', 'ESB', 'Stout', 'Porter', 'Brown Ale'] },
  { id: 'fermentis-s33', name: 'Safale S-33', brand: 'Fermentis', strain: 'S-33', form: 'dry', attenuation_min: 68, attenuation_max: 72, flocculation: 'medium', temp_min: 15, temp_max: 24, alcohol_tolerance_pct: 11.5, flavor: 'Fruity, phenolic Belgian character', styles: ['Belgian Wheat', 'Blanche', 'Tripel', 'Belgian Blonde'] },
  { id: 'fermentis-k97', name: 'Safale K-97', brand: 'Fermentis', strain: 'K-97', form: 'dry', attenuation_min: 80, attenuation_max: 84, flocculation: 'high', temp_min: 12, temp_max: 25, alcohol_tolerance_pct: 11, flavor: 'German ale, clean, crisp, Kölsch style', styles: ['Kölsch', 'Altbier', 'German Wheat'] },
  { id: 'fermentis-wb06', name: 'Safbrew WB-06', brand: 'Fermentis', strain: 'WB-06', form: 'dry', attenuation_min: 86, attenuation_max: 90, flocculation: 'low', temp_min: 12, temp_max: 25, alcohol_tolerance_pct: 11, flavor: 'Wheat beer, banana/clove, phenolic', styles: ['Hefeweizen', 'Dunkelweizen', 'Weizenbock'] },
  { id: 'fermentis-t58', name: 'Safbrew T-58', brand: 'Fermentis', strain: 'T-58', form: 'dry', attenuation_min: 72, attenuation_max: 78, flocculation: 'medium', temp_min: 15, temp_max: 24, alcohol_tolerance_pct: 11.5, flavor: 'Spicy, clove, peppery Belgian character', styles: ['Belgian Blond', 'Saison', 'Belgian Pale Ale'] },
  { id: 'fermentis-be134', name: 'SafAle BE-134', brand: 'Fermentis', strain: 'BE-134', form: 'dry', attenuation_min: 89, attenuation_max: 93, flocculation: 'low', temp_min: 18, temp_max: 28, alcohol_tolerance_pct: 13, flavor: 'Very dry, fruity, spicy — Saison specialist', styles: ['Saison', 'Farmhouse Ale', 'Bière de Garde'] },
  { id: 'fermentis-be256', name: 'SafAle BE-256', brand: 'Fermentis', strain: 'BE-256', form: 'dry', attenuation_min: 82, attenuation_max: 86, flocculation: 'high', temp_min: 15, temp_max: 24, alcohol_tolerance_pct: 13, flavor: 'Clean Belgian, fruity esters', styles: ['Belgian Golden Strong', 'Tripel', 'Dubbel'] },
  { id: 'fermentis-w3470', name: 'SafLager W-34/70', brand: 'Fermentis', strain: 'W-34/70', form: 'dry', attenuation_min: 80, attenuation_max: 84, flocculation: 'high', temp_min: 9, temp_max: 15, alcohol_tolerance_pct: 11, flavor: 'Clean, crisp, classic lager — most used worldwide', styles: ['Pilsner', 'Helles', 'Märzen', 'Bock', 'Dunkel'] },
  { id: 'fermentis-s189', name: 'SafLager S-189', brand: 'Fermentis', strain: 'S-189', form: 'dry', attenuation_min: 80, attenuation_max: 84, flocculation: 'high', temp_min: 9, temp_max: 13, alcohol_tolerance_pct: 11, flavor: 'Swiss lager, clean, slight fruit', styles: ['Pilsner', 'Export', 'Dortmunder'] },

  // ── Lallemand (Dry) ───────────────────────────────────────
  { id: 'lal-nottingham', name: 'Nottingham', brand: 'Lallemand', strain: 'Nottingham', form: 'dry', attenuation_min: 78, attenuation_max: 86, flocculation: 'very high', temp_min: 10, temp_max: 25, alcohol_tolerance_pct: 14, flavor: 'Clean, neutral, fast and reliable', styles: ['English Pale Ale', 'IPA', 'Bitter', 'Stout'] },
  { id: 'lal-windsor', name: 'Windsor', brand: 'Lallemand', strain: 'Windsor', form: 'dry', attenuation_min: 65, attenuation_max: 72, flocculation: 'medium', temp_min: 15, temp_max: 25, alcohol_tolerance_pct: 10, flavor: 'Fruity, estery, full-bodied, low attenuator', styles: ['English Bitter', 'Mild', 'Scottish Ale'] },
  { id: 'lal-belle-saison', name: 'Belle Saison', brand: 'Lallemand', form: 'dry', attenuation_min: 88, attenuation_max: 94, flocculation: 'low', temp_min: 15, temp_max: 35, alcohol_tolerance_pct: 15, flavor: 'Fruity, spicy, dry, peppery — super attenuator', styles: ['Saison', 'Farmhouse', 'Belgian Blonde'] },
  { id: 'lal-abbaye', name: 'Abbaye', brand: 'Lallemand', form: 'dry', attenuation_min: 78, attenuation_max: 84, flocculation: 'medium-high', temp_min: 17, temp_max: 25, alcohol_tolerance_pct: 14, flavor: 'Banana, clove, fruity esters, phenolic', styles: ['Belgian Dubbel', 'Tripel', 'Belgian Dark Strong'] },
  { id: 'lal-voss-kveik', name: 'Voss Kveik', brand: 'Lallemand', form: 'dry', attenuation_min: 78, attenuation_max: 82, flocculation: 'very high', temp_min: 25, temp_max: 40, alcohol_tolerance_pct: 12, flavor: 'Orange peel, citrus, fast at high temps', styles: ['IPA', 'Pale Ale', 'Norwegian Farmhouse'] },
  { id: 'lal-verdant', name: 'Verdant IPA', brand: 'Lallemand', form: 'dry', attenuation_min: 74, attenuation_max: 78, flocculation: 'low', temp_min: 18, temp_max: 23, alcohol_tolerance_pct: 10, flavor: 'Tropical, peachy, enhances hop character, hazy', styles: ['NEIPA', 'Hazy IPA', 'Hazy Pale'] },
  { id: 'lal-london', name: 'London ESB', brand: 'Lallemand', form: 'dry', attenuation_min: 72, attenuation_max: 78, flocculation: 'high', temp_min: 15, temp_max: 22, alcohol_tolerance_pct: 12, flavor: 'Malty, fruity, minerally English character', styles: ['ESB', 'English Bitter', 'Brown Ale', 'English IPA'] },

  // ── Mangrove Jack's (Dry) ─────────────────────────────────
  { id: 'mj-m44', name: 'M44 US West Coast', brand: "Mangrove Jack's", form: 'dry', attenuation_min: 78, attenuation_max: 84, flocculation: 'high', temp_min: 16, temp_max: 22, alcohol_tolerance_pct: 12, flavor: 'Clean, crisp, lets hops shine', styles: ['West Coast IPA', 'American Pale Ale', 'DIPA'] },
  { id: 'mj-m36', name: 'M36 Liberty Bell Ale', brand: "Mangrove Jack's", form: 'dry', attenuation_min: 76, attenuation_max: 82, flocculation: 'medium-high', temp_min: 15, temp_max: 23, alcohol_tolerance_pct: 11, flavor: 'Clean, balanced, versatile', styles: ['Pale Ale', 'Blonde Ale', 'Cream Ale'] },
  { id: 'mj-m21', name: 'M21 Belgian Wit', brand: "Mangrove Jack's", form: 'dry', attenuation_min: 72, attenuation_max: 76, flocculation: 'low', temp_min: 17, temp_max: 26, alcohol_tolerance_pct: 10, flavor: 'Spicy, phenolic, moderate esters, hazy', styles: ['Witbier', 'Belgian Blanche', 'Belgian Wheat'] },
  { id: 'mj-m42', name: 'M42 New World Strong Ale', brand: "Mangrove Jack's", form: 'dry', attenuation_min: 80, attenuation_max: 88, flocculation: 'medium-high', temp_min: 16, temp_max: 22, alcohol_tolerance_pct: 14, flavor: 'Clean, attenuative, high ABV capable', styles: ['American Strong Ale', 'Imperial IPA', 'Barleywine'] },

  // ── White Labs (Liquid) ───────────────────────────────────
  { id: 'wlp001', name: 'WLP001 California Ale', brand: 'White Labs', strain: 'WLP001', form: 'liquid', attenuation_min: 73, attenuation_max: 80, flocculation: 'medium', temp_min: 16, temp_max: 21, alcohol_tolerance_pct: 12, flavor: 'Clean, versatile, slight fruit, American classic', styles: ['American Pale Ale', 'IPA', 'Blonde Ale'] },
  { id: 'wlp002', name: 'WLP002 English Ale', brand: 'White Labs', strain: 'WLP002', form: 'liquid', attenuation_min: 63, attenuation_max: 70, flocculation: 'very high', temp_min: 16, temp_max: 20, alcohol_tolerance_pct: 10, flavor: 'Malty, fruity, classic English, leaves residual sweetness', styles: ['English Bitter', 'ESB', 'English Brown'] },
  { id: 'wlp004', name: 'WLP004 Irish Ale', brand: 'White Labs', strain: 'WLP004', form: 'liquid', attenuation_min: 69, attenuation_max: 74, flocculation: 'medium-high', temp_min: 16, temp_max: 20, alcohol_tolerance_pct: 12, flavor: 'Slight fruity esters, clean, woody', styles: ['Irish Stout', 'Red Ale', 'Dry Stout'] },
  { id: 'wlp500', name: 'WLP500 Monastery Ale', brand: 'White Labs', strain: 'WLP500', form: 'liquid', attenuation_min: 75, attenuation_max: 80, flocculation: 'medium-high', temp_min: 18, temp_max: 24, alcohol_tolerance_pct: 14, flavor: 'Banana, clove, phenolic, plum — Chimay strain', styles: ['Belgian Dubbel', 'Tripel', 'Belgian Dark Strong'] },
  { id: 'wlp530', name: 'WLP530 Abbey Ale', brand: 'White Labs', strain: 'WLP530', form: 'liquid', attenuation_min: 75, attenuation_max: 80, flocculation: 'medium-high', temp_min: 18, temp_max: 24, alcohol_tolerance_pct: 15, flavor: 'Fruity, plum, pear, spicy — Westmalle strain', styles: ['Tripel', 'Belgian Golden Strong', 'Dubbel'] },
  { id: 'wlp565', name: 'WLP565 Belgian Saison I', brand: 'White Labs', strain: 'WLP565', form: 'liquid', attenuation_min: 65, attenuation_max: 75, flocculation: 'medium', temp_min: 20, temp_max: 29, alcohol_tolerance_pct: 12, flavor: 'Fruity, spicy, earthy — Dupont strain', styles: ['Saison', 'Farmhouse Ale'] },
  { id: 'wlp830', name: 'WLP830 German Lager', brand: 'White Labs', strain: 'WLP830', form: 'liquid', attenuation_min: 74, attenuation_max: 79, flocculation: 'medium', temp_min: 9, temp_max: 13, alcohol_tolerance_pct: 11, flavor: 'Clean, malty, slightly sweet, classic German', styles: ['Helles', 'Märzen', 'Dunkel', 'Schwarzbier'] },

  // ── Wyeast (Liquid) ───────────────────────────────────────
  { id: 'wyeast-1056', name: '1056 American Ale', brand: 'Wyeast', strain: '1056', form: 'liquid', attenuation_min: 73, attenuation_max: 77, flocculation: 'medium', temp_min: 16, temp_max: 22, alcohol_tolerance_pct: 11, flavor: 'Clean, neutral, lets ingredients shine', styles: ['American Pale Ale', 'IPA', 'American Wheat'] },
  { id: 'wyeast-1318', name: '1318 London Ale III', brand: 'Wyeast', strain: '1318', form: 'liquid', attenuation_min: 71, attenuation_max: 75, flocculation: 'high', temp_min: 18, temp_max: 22, alcohol_tolerance_pct: 10, flavor: 'Fruity, slightly sweet, builds body — NEIPA classic', styles: ['NEIPA', 'Hazy IPA', 'English Bitter'] },
  { id: 'wyeast-1968', name: '1968 London ESB', brand: 'Wyeast', strain: '1968', form: 'liquid', attenuation_min: 67, attenuation_max: 71, flocculation: 'very high', temp_min: 18, temp_max: 22, alcohol_tolerance_pct: 9, flavor: 'Malty, full, fruity esters — Fuller\'s strain', styles: ['ESB', 'English Bitter', 'English IPA'] },
  { id: 'wyeast-3068', name: '3068 Weihenstephan Weizen', brand: 'Wyeast', strain: '3068', form: 'liquid', attenuation_min: 73, attenuation_max: 77, flocculation: 'low', temp_min: 18, temp_max: 24, alcohol_tolerance_pct: 10, flavor: 'Banana, clove, bubblegum — classic Weizen', styles: ['Hefeweizen', 'Dunkelweizen', 'Kristallweizen'] },
  { id: 'wyeast-3711', name: '3711 French Saison', brand: 'Wyeast', strain: '3711', form: 'liquid', attenuation_min: 77, attenuation_max: 83, flocculation: 'low', temp_min: 18, temp_max: 27, alcohol_tolerance_pct: 12, flavor: 'Peppery, spicy, dry, super attenuator', styles: ['Saison', 'Farmhouse Ale'] },
  { id: 'wyeast-2206', name: '2206 Bavarian Lager', brand: 'Wyeast', strain: '2206', form: 'liquid', attenuation_min: 73, attenuation_max: 77, flocculation: 'medium-high', temp_min: 9, temp_max: 13, alcohol_tolerance_pct: 11, flavor: 'Rich, malty, complex — excellent for dark lagers', styles: ['Bock', 'Märzen', 'Dunkel', 'Schwarzbier'] },
  { id: 'wyeast-3787', name: '3787 Trappist High Gravity', brand: 'Wyeast', strain: '3787', form: 'liquid', attenuation_min: 74, attenuation_max: 78, flocculation: 'medium', temp_min: 18, temp_max: 25, alcohol_tolerance_pct: 16, flavor: 'Fruity, phenolic, complex — Westmalle-inspired', styles: ['Belgian Tripel', 'Belgian Golden Strong', 'Quad'] },

  // ── Omega Yeast (Liquid) ──────────────────────────────────
  { id: 'omega-hothead', name: 'OYL-057 HotHead', brand: 'Omega Yeast', form: 'liquid', attenuation_min: 75, attenuation_max: 85, flocculation: 'medium-high', temp_min: 16, temp_max: 37, alcohol_tolerance_pct: 11, flavor: 'Clean at any temp, tropical hints, versatile kveik', styles: ['IPA', 'Pale Ale', 'Kveik styles'] },
  { id: 'omega-tropical', name: 'OYL-200 Tropical IPA', brand: 'Omega Yeast', form: 'liquid', attenuation_min: 74, attenuation_max: 78, flocculation: 'low', temp_min: 18, temp_max: 22, alcohol_tolerance_pct: 10, flavor: 'Enhances hop tropical character, beta-lyase active', styles: ['NEIPA', 'Hazy IPA', 'Hazy Pale'] },

  // ── Imperial Yeast (Liquid) ───────────────────────────────
  { id: 'imp-a38', name: 'A38 Juice', brand: 'Imperial Yeast', form: 'liquid', attenuation_min: 72, attenuation_max: 76, flocculation: 'medium-high', temp_min: 18, temp_max: 22, alcohol_tolerance_pct: 10, flavor: 'Juicy, fruity, hazy character', styles: ['NEIPA', 'Hazy IPA'] },
  { id: 'imp-a07', name: 'A07 Flagship', brand: 'Imperial Yeast', form: 'liquid', attenuation_min: 73, attenuation_max: 77, flocculation: 'medium', temp_min: 16, temp_max: 22, alcohol_tolerance_pct: 11, flavor: 'Clean, versatile American ale', styles: ['American Pale Ale', 'IPA', 'Blonde Ale'] },
]

/** Quick lookup by ID */
export const YEAST_MAP = Object.fromEntries(YEAST_DATABASE.map(y => [y.id, y]))

/** Unique brands */
export const YEAST_BRANDS = [...new Set(YEAST_DATABASE.map(y => y.brand))]
