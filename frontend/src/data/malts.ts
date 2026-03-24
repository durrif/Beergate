// frontend/src/data/malts.ts — Comprehensive malt database for Beergate v3 Recipe Calculator

export interface MaltSpec {
  id: string
  name: string
  brand: string
  type: 'base' | 'specialty' | 'caramel' | 'roasted' | 'adjunct' | 'sugar'
  color_lovibond: number
  color_ebc: number
  potential_sg: number        // e.g. 1.037
  max_pct: number             // max recommended % of grain bill
  diastatic_power?: number    // °Lintner
  protein_pct?: number
  flavor: string
  origin: string
  substitutes: string[]       // IDs of substitute malts
}

export const MALT_DATABASE: MaltSpec[] = [
  // ── Weyermann ────────────────────────────────────────────
  { id: 'wey-pilsner', name: 'Pilsner Malt', brand: 'Weyermann', type: 'base', color_lovibond: 1.6, color_ebc: 3.3, potential_sg: 1.038, max_pct: 100, diastatic_power: 110, flavor: 'Light, sweet, honey, delicate grain', origin: 'DE', substitutes: ['cm-pils', 'crisp-maris', 'briess-pilsen'] },
  { id: 'wey-vienna', name: 'Vienna Malt', brand: 'Weyermann', type: 'base', color_lovibond: 3.5, color_ebc: 7, potential_sg: 1.036, max_pct: 100, diastatic_power: 50, flavor: 'Biscuit, light toast, malty sweetness', origin: 'DE', substitutes: ['cm-vienna', 'briess-vienna'] },
  { id: 'wey-munich-i', name: 'Munich Malt Type I', brand: 'Weyermann', type: 'base', color_lovibond: 6, color_ebc: 12.5, potential_sg: 1.037, max_pct: 100, diastatic_power: 70, flavor: 'Rich malt, bread crust, slight toast', origin: 'DE', substitutes: ['cm-munich', 'briess-munich'] },
  { id: 'wey-munich-ii', name: 'Munich Malt Type II', brand: 'Weyermann', type: 'base', color_lovibond: 9, color_ebc: 18, potential_sg: 1.037, max_pct: 100, diastatic_power: 40, flavor: 'Deep malt, toast, amber sweetness', origin: 'DE', substitutes: ['cm-munich', 'briess-munich'] },
  { id: 'wey-wheat', name: 'Wheat Malt', brand: 'Weyermann', type: 'base', color_lovibond: 2, color_ebc: 4, potential_sg: 1.038, max_pct: 70, diastatic_power: 95, flavor: 'Bread, light tartness, creamy mouthfeel', origin: 'DE', substitutes: ['cm-wheat', 'briess-wheat'] },
  { id: 'wey-carapils', name: 'CaraPils / CaraFoam', brand: 'Weyermann', type: 'caramel', color_lovibond: 2, color_ebc: 4, potential_sg: 1.033, max_pct: 20, flavor: 'Body, foam retention, no color', origin: 'DE', substitutes: ['briess-carapils'] },
  { id: 'wey-cara-amber', name: 'CaraAmber', brand: 'Weyermann', type: 'caramel', color_lovibond: 30, color_ebc: 60, potential_sg: 1.034, max_pct: 25, flavor: 'Amber sweetness, caramel, dried fruit', origin: 'DE', substitutes: ['cm-cara-50'] },
  { id: 'wey-cara-munich-i', name: 'CaraMunich I', brand: 'Weyermann', type: 'caramel', color_lovibond: 34, color_ebc: 70, potential_sg: 1.034, max_pct: 20, flavor: 'Caramel, honey, body enhancer', origin: 'DE', substitutes: ['cm-cara-50', 'crisp-crystal-60'] },
  { id: 'wey-cara-munich-ii', name: 'CaraMunich II', brand: 'Weyermann', type: 'caramel', color_lovibond: 46, color_ebc: 90, potential_sg: 1.034, max_pct: 20, flavor: 'Deep caramel, toffee, raisin notes', origin: 'DE', substitutes: ['crisp-crystal-80'] },
  { id: 'wey-cara-munich-iii', name: 'CaraMunich III', brand: 'Weyermann', type: 'caramel', color_lovibond: 57, color_ebc: 110, potential_sg: 1.034, max_pct: 15, flavor: 'Dark caramel, plum, rich sweetness', origin: 'DE', substitutes: ['crisp-crystal-120'] },
  { id: 'wey-melanoidin', name: 'Melanoidin Malt', brand: 'Weyermann', type: 'specialty', color_lovibond: 23, color_ebc: 45, potential_sg: 1.037, max_pct: 20, flavor: 'Biscuit, honey-like, complex malt depth', origin: 'DE', substitutes: ['cm-melanoidin'] },
  { id: 'wey-acidulated', name: 'Acidulated Malt', brand: 'Weyermann', type: 'specialty', color_lovibond: 1.8, color_ebc: 3.5, potential_sg: 1.033, max_pct: 10, flavor: 'Sour, lactic acid for pH adjustment', origin: 'DE', substitutes: [] },
  { id: 'wey-chocolate-wheat', name: 'Chocolate Wheat Malt', brand: 'Weyermann', type: 'roasted', color_lovibond: 400, color_ebc: 800, potential_sg: 1.033, max_pct: 10, flavor: 'Chocolate, coffee, smooth dark roast', origin: 'DE', substitutes: ['wey-carafa-ii'] },
  { id: 'wey-carafa-i', name: 'Carafa Special I', brand: 'Weyermann', type: 'roasted', color_lovibond: 337, color_ebc: 700, potential_sg: 1.032, max_pct: 10, flavor: 'Dehusked dark malt, smooth coffee, minimal harshness', origin: 'DE', substitutes: ['wey-carafa-ii'] },
  { id: 'wey-carafa-ii', name: 'Carafa Special II', brand: 'Weyermann', type: 'roasted', color_lovibond: 425, color_ebc: 900, potential_sg: 1.032, max_pct: 10, flavor: 'Dark chocolate, espresso, smooth bitterness', origin: 'DE', substitutes: ['wey-carafa-iii'] },
  { id: 'wey-carafa-iii', name: 'Carafa Special III', brand: 'Weyermann', type: 'roasted', color_lovibond: 525, color_ebc: 1100, potential_sg: 1.032, max_pct: 5, flavor: 'Intense roast, smooth burnt character', origin: 'DE', substitutes: [] },
  { id: 'wey-smoked', name: 'Beechwood Smoked Malt', brand: 'Weyermann', type: 'specialty', color_lovibond: 2, color_ebc: 4, potential_sg: 1.037, max_pct: 100, diastatic_power: 60, flavor: 'Beechwood smoke, bacon, campfire', origin: 'DE', substitutes: [] },

  // ── Castle Malting ───────────────────────────────────────
  { id: 'cm-pils', name: 'Château Pilsen 2RS', brand: 'Castle Malting', type: 'base', color_lovibond: 1.5, color_ebc: 3, potential_sg: 1.037, max_pct: 100, diastatic_power: 105, flavor: 'Clean, delicate malt, slightly sweet', origin: 'BE', substitutes: ['wey-pilsner', 'crisp-maris'] },
  { id: 'cm-pale-ale', name: 'Château Pale Ale', brand: 'Castle Malting', type: 'base', color_lovibond: 3.4, color_ebc: 7, potential_sg: 1.038, max_pct: 100, diastatic_power: 85, flavor: 'Nutty, biscuit, full-bodied base', origin: 'BE', substitutes: ['crisp-maris', 'briess-pale'] },
  { id: 'cm-vienna', name: 'Château Vienna', brand: 'Castle Malting', type: 'base', color_lovibond: 3.5, color_ebc: 7.5, potential_sg: 1.036, max_pct: 100, diastatic_power: 60, flavor: 'Light toast, bread crust', origin: 'BE', substitutes: ['wey-vienna'] },
  { id: 'cm-munich', name: 'Château Munich', brand: 'Castle Malting', type: 'base', color_lovibond: 8, color_ebc: 17, potential_sg: 1.037, max_pct: 80, diastatic_power: 45, flavor: 'Rich malt, toast, amber warmth', origin: 'BE', substitutes: ['wey-munich-i'] },
  { id: 'cm-wheat', name: 'Château Wheat Blanc', brand: 'Castle Malting', type: 'base', color_lovibond: 2, color_ebc: 4, potential_sg: 1.038, max_pct: 65, diastatic_power: 90, flavor: 'Light, grainy, good for wheat beers', origin: 'BE', substitutes: ['wey-wheat'] },
  { id: 'cm-cara-50', name: 'Château Cara Gold', brand: 'Castle Malting', type: 'caramel', color_lovibond: 25, color_ebc: 50, potential_sg: 1.034, max_pct: 20, flavor: 'Caramel, toffee, body enhancer', origin: 'BE', substitutes: ['wey-cara-amber'] },
  { id: 'cm-cara-120', name: 'Château Cara Ruby', brand: 'Castle Malting', type: 'caramel', color_lovibond: 60, color_ebc: 120, potential_sg: 1.033, max_pct: 15, flavor: 'Dark dried fruit, plum, deep sweetness', origin: 'BE', substitutes: ['wey-cara-munich-iii'] },
  { id: 'cm-melanoidin', name: 'Château Melanoidin', brand: 'Castle Malting', type: 'specialty', color_lovibond: 23, color_ebc: 45, potential_sg: 1.037, max_pct: 20, flavor: 'Biscuit, rich malt depth', origin: 'BE', substitutes: ['wey-melanoidin'] },
  { id: 'cm-biscuit', name: 'Château Biscuit', brand: 'Castle Malting', type: 'specialty', color_lovibond: 23, color_ebc: 45, potential_sg: 1.036, max_pct: 25, flavor: 'Biscuit, bread crust, warm nutty', origin: 'BE', substitutes: ['wey-melanoidin'] },
  { id: 'cm-chocolate', name: 'Château Chocolat', brand: 'Castle Malting', type: 'roasted', color_lovibond: 350, color_ebc: 700, potential_sg: 1.032, max_pct: 10, flavor: 'Chocolate, roast, subtle bitterness', origin: 'BE', substitutes: ['crisp-choc'] },
  { id: 'cm-roasted', name: 'Château Roasted Barley', brand: 'Castle Malting', type: 'roasted', color_lovibond: 575, color_ebc: 1200, potential_sg: 1.025, max_pct: 10, flavor: 'Intense coffee, dry roast, stout character', origin: 'BE', substitutes: ['crisp-roast-barley'] },
  { id: 'cm-black', name: 'Château Black', brand: 'Castle Malting', type: 'roasted', color_lovibond: 550, color_ebc: 1150, potential_sg: 1.028, max_pct: 7, flavor: 'Sharp roast, espresso, color contribution', origin: 'BE', substitutes: [] },

  // ── Crisp Malt (UK) ──────────────────────────────────────
  { id: 'crisp-maris', name: 'Maris Otter Pale', brand: 'Crisp Malt', type: 'base', color_lovibond: 3, color_ebc: 6, potential_sg: 1.038, max_pct: 100, diastatic_power: 82, flavor: 'Biscuit, nutty, classic English base', origin: 'GB', substitutes: ['cm-pale-ale', 'briess-pale'] },
  { id: 'crisp-best', name: 'Best Ale Malt', brand: 'Crisp Malt', type: 'base', color_lovibond: 3.5, color_ebc: 7.5, potential_sg: 1.037, max_pct: 100, diastatic_power: 75, flavor: 'Clean, versatile English pale malt', origin: 'GB', substitutes: ['crisp-maris'] },
  { id: 'crisp-crystal-60', name: 'Crystal 60L', brand: 'Crisp Malt', type: 'caramel', color_lovibond: 60, color_ebc: 120, potential_sg: 1.034, max_pct: 20, flavor: 'Sweet caramel, toffee, dried fruit', origin: 'GB', substitutes: ['wey-cara-munich-ii'] },
  { id: 'crisp-crystal-80', name: 'Crystal 80L', brand: 'Crisp Malt', type: 'caramel', color_lovibond: 80, color_ebc: 160, potential_sg: 1.033, max_pct: 15, flavor: 'Dark toffee, raisin, brown sugar', origin: 'GB', substitutes: ['wey-cara-munich-iii'] },
  { id: 'crisp-crystal-120', name: 'Crystal 120L', brand: 'Crisp Malt', type: 'caramel', color_lovibond: 120, color_ebc: 240, potential_sg: 1.033, max_pct: 10, flavor: 'Burnt sugar, dark fruit, intense sweetness', origin: 'GB', substitutes: [] },
  { id: 'crisp-choc', name: 'Chocolate Malt', brand: 'Crisp Malt', type: 'roasted', color_lovibond: 425, color_ebc: 850, potential_sg: 1.030, max_pct: 10, flavor: 'Dark chocolate, coffee, sharp roast', origin: 'GB', substitutes: ['cm-chocolate'] },
  { id: 'crisp-roast-barley', name: 'Roasted Barley', brand: 'Crisp Malt', type: 'roasted', color_lovibond: 500, color_ebc: 1050, potential_sg: 1.025, max_pct: 10, flavor: 'Coffee, dry roast, classic stout grain', origin: 'GB', substitutes: ['cm-roasted'] },
  { id: 'crisp-black-patent', name: 'Black Patent Malt', brand: 'Crisp Malt', type: 'roasted', color_lovibond: 550, color_ebc: 1150, potential_sg: 1.025, max_pct: 5, flavor: 'Intense acrid roast, sharp bitter, color', origin: 'GB', substitutes: [] },

  // ── Briess (US) ──────────────────────────────────────────
  { id: 'briess-pale', name: 'Pale Ale Malt', brand: 'Briess', type: 'base', color_lovibond: 3.5, color_ebc: 7, potential_sg: 1.037, max_pct: 100, diastatic_power: 85, flavor: 'Clean, light biscuit, versatile American base', origin: 'US', substitutes: ['crisp-maris', 'cm-pale-ale'] },
  { id: 'briess-pilsen', name: 'Pilsen Malt', brand: 'Briess', type: 'base', color_lovibond: 1.2, color_ebc: 2.5, potential_sg: 1.036, max_pct: 100, diastatic_power: 100, flavor: 'Very light, clean, subtle honey', origin: 'US', substitutes: ['wey-pilsner', 'cm-pils'] },
  { id: 'briess-vienna', name: 'Vienna Malt', brand: 'Briess', type: 'base', color_lovibond: 3.5, color_ebc: 7.5, potential_sg: 1.036, max_pct: 100, diastatic_power: 60, flavor: 'Light toast, graham cracker', origin: 'US', substitutes: ['wey-vienna', 'cm-vienna'] },
  { id: 'briess-munich', name: 'Munich Malt 10L', brand: 'Briess', type: 'base', color_lovibond: 10, color_ebc: 20, potential_sg: 1.035, max_pct: 80, diastatic_power: 45, flavor: 'Rich malty sweetness, amber notes', origin: 'US', substitutes: ['wey-munich-i', 'cm-munich'] },
  { id: 'briess-wheat', name: 'White Wheat Malt', brand: 'Briess', type: 'base', color_lovibond: 2.5, color_ebc: 5, potential_sg: 1.038, max_pct: 60, diastatic_power: 80, flavor: 'Clean wheat, creamy, grainy', origin: 'US', substitutes: ['wey-wheat'] },
  { id: 'briess-carapils', name: 'Carapils / Dextrine Malt', brand: 'Briess', type: 'caramel', color_lovibond: 1.5, color_ebc: 3, potential_sg: 1.033, max_pct: 20, flavor: 'Body, foam stability, no added color', origin: 'US', substitutes: ['wey-carapils'] },
  { id: 'briess-c40', name: 'Caramel/Crystal 40L', brand: 'Briess', type: 'caramel', color_lovibond: 40, color_ebc: 80, potential_sg: 1.034, max_pct: 20, flavor: 'Clean caramel, honey sweetness', origin: 'US', substitutes: ['wey-cara-munich-i'] },
  { id: 'briess-c60', name: 'Caramel/Crystal 60L', brand: 'Briess', type: 'caramel', color_lovibond: 60, color_ebc: 120, potential_sg: 1.034, max_pct: 15, flavor: 'Caramel, toffee, rich body', origin: 'US', substitutes: ['crisp-crystal-60'] },
  { id: 'briess-c80', name: 'Caramel/Crystal 80L', brand: 'Briess', type: 'caramel', color_lovibond: 80, color_ebc: 160, potential_sg: 1.033, max_pct: 10, flavor: 'Dark caramel, raisin, toffee', origin: 'US', substitutes: ['crisp-crystal-80'] },
  { id: 'briess-c120', name: 'Caramel/Crystal 120L', brand: 'Briess', type: 'caramel', color_lovibond: 120, color_ebc: 240, potential_sg: 1.033, max_pct: 10, flavor: 'Burnt sugar, dark fruit, intense', origin: 'US', substitutes: ['crisp-crystal-120'] },

  // ── Simpson's (UK) ───────────────────────────────────────
  { id: 'simpsons-golden-promise', name: 'Golden Promise', brand: "Simpson's", type: 'base', color_lovibond: 2.5, color_ebc: 5, potential_sg: 1.037, max_pct: 100, diastatic_power: 70, flavor: 'Rich, clean, sweet maltiness, Scotch ale classic', origin: 'GB', substitutes: ['crisp-maris'] },

  // ── Sugars & Adjuncts ────────────────────────────────────
  { id: 'sugar-cane', name: 'Cane Sugar (Sucrose)', brand: 'Generic', type: 'sugar', color_lovibond: 0, color_ebc: 0, potential_sg: 1.046, max_pct: 20, flavor: 'Dry, thin body, highly fermentable', origin: '—', substitutes: [] },
  { id: 'sugar-corn', name: 'Corn Sugar (Dextrose)', brand: 'Generic', type: 'sugar', color_lovibond: 0, color_ebc: 0, potential_sg: 1.042, max_pct: 20, flavor: 'Clean, dry, no residual sweetness', origin: '—', substitutes: ['sugar-cane'] },
  { id: 'sugar-dark-candy', name: 'Dark Candi Sugar', brand: 'Generic', type: 'sugar', color_lovibond: 275, color_ebc: 550, potential_sg: 1.036, max_pct: 20, flavor: 'Dark fruit, caramel, Belgian abbey character', origin: 'BE', substitutes: [] },
  { id: 'adjunct-flaked-oats', name: 'Flaked Oats', brand: 'Generic', type: 'adjunct', color_lovibond: 1, color_ebc: 2, potential_sg: 1.033, max_pct: 30, flavor: 'Creamy, silky, full body, haze', origin: '—', substitutes: [] },
  { id: 'adjunct-flaked-wheat', name: 'Flaked Wheat', brand: 'Generic', type: 'adjunct', color_lovibond: 1.5, color_ebc: 3, potential_sg: 1.034, max_pct: 40, flavor: 'Haze, head retention, wheat flavor', origin: '—', substitutes: [] },
  { id: 'adjunct-rice-hulls', name: 'Rice Hulls', brand: 'Generic', type: 'adjunct', color_lovibond: 0, color_ebc: 0, potential_sg: 1.000, max_pct: 10, flavor: 'No flavor — filter aid for stuck mash', origin: '—', substitutes: [] },
  { id: 'adjunct-lactose', name: 'Lactose', brand: 'Generic', type: 'sugar', color_lovibond: 0, color_ebc: 0, potential_sg: 1.043, max_pct: 15, flavor: 'Residual sweetness, body — unfermentable', origin: '—', substitutes: [] },
  { id: 'adjunct-honey', name: 'Honey', brand: 'Generic', type: 'sugar', color_lovibond: 4, color_ebc: 8, potential_sg: 1.035, max_pct: 30, flavor: 'Floral, sweet, dries out considerably', origin: '—', substitutes: [] },
]

/** Quick lookup by ID */
export const MALT_MAP = Object.fromEntries(MALT_DATABASE.map(m => [m.id, m]))

/** Unique brands */
export const MALT_BRANDS = [...new Set(MALT_DATABASE.map(m => m.brand))]

/** Unique types */
export const MALT_TYPES: MaltSpec['type'][] = ['base', 'specialty', 'caramel', 'roasted', 'adjunct', 'sugar']
