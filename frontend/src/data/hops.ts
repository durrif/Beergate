// frontend/src/data/hops.ts — Comprehensive hops database for Beergate v3 Recipe Calculator

export interface HopSpec {
  id: string
  name: string
  alpha_acid_min: number
  alpha_acid_max: number
  beta_acid_min: number
  beta_acid_max: number
  usage: 'bittering' | 'aroma' | 'dual'
  flavor: string[]           // aroma/flavor descriptors
  origin: string
  substitutes: string[]      // IDs of substitute hops
}

export const HOP_DATABASE: HopSpec[] = [
  // ── American ──────────────────────────────────────────────
  { id: 'cascade', name: 'Cascade', alpha_acid_min: 4.5, alpha_acid_max: 7.0, beta_acid_min: 4.8, beta_acid_max: 7.0, usage: 'dual', flavor: ['Citrus', 'Floral', 'Grapefruit', 'Spicy'], origin: 'US', substitutes: ['centennial', 'amarillo'] },
  { id: 'centennial', name: 'Centennial', alpha_acid_min: 9.5, alpha_acid_max: 11.5, beta_acid_min: 3.5, beta_acid_max: 4.5, usage: 'dual', flavor: ['Citrus', 'Floral', 'Medium-intensity Cascade'], origin: 'US', substitutes: ['cascade', 'chinook'] },
  { id: 'chinook', name: 'Chinook', alpha_acid_min: 12.0, alpha_acid_max: 14.0, beta_acid_min: 3.0, beta_acid_max: 4.0, usage: 'bittering', flavor: ['Pine', 'Spicy', 'Grapefruit', 'Pungent'], origin: 'US', substitutes: ['columbus', 'nugget'] },
  { id: 'citra', name: 'Citra', alpha_acid_min: 11.0, alpha_acid_max: 13.0, beta_acid_min: 3.5, beta_acid_max: 4.5, usage: 'dual', flavor: ['Tropical fruit', 'Mango', 'Passion fruit', 'Citrus', 'Grapefruit'], origin: 'US', substitutes: ['galaxy', 'mosaic'] },
  { id: 'mosaic', name: 'Mosaic', alpha_acid_min: 11.5, alpha_acid_max: 13.5, beta_acid_min: 3.2, beta_acid_max: 3.9, usage: 'dual', flavor: ['Blueberry', 'Tropical', 'Earthy', 'Stone fruit', 'Berry'], origin: 'US', substitutes: ['citra', 'simcoe'] },
  { id: 'simcoe', name: 'Simcoe', alpha_acid_min: 12.0, alpha_acid_max: 14.0, beta_acid_min: 4.0, beta_acid_max: 5.0, usage: 'dual', flavor: ['Pine', 'Earthy', 'Berry', 'Apricot', 'Passion fruit'], origin: 'US', substitutes: ['mosaic', 'amarillo'] },
  { id: 'amarillo', name: 'Amarillo', alpha_acid_min: 8.0, alpha_acid_max: 11.0, beta_acid_min: 6.0, beta_acid_max: 7.0, usage: 'dual', flavor: ['Orange', 'Tropical', 'Floral', 'Grapefruit'], origin: 'US', substitutes: ['cascade', 'citra'] },
  { id: 'columbus', name: 'Columbus / CTZ', alpha_acid_min: 14.0, alpha_acid_max: 18.0, beta_acid_min: 4.5, beta_acid_max: 5.5, usage: 'bittering', flavor: ['Earthy', 'Spicy', 'Pungent', 'Dank'], origin: 'US', substitutes: ['chinook', 'nugget'] },
  { id: 'nugget', name: 'Nugget', alpha_acid_min: 12.0, alpha_acid_max: 14.5, beta_acid_min: 4.0, beta_acid_max: 5.5, usage: 'bittering', flavor: ['Herbal', 'Spicy', 'Clean bittering'], origin: 'US', substitutes: ['magnum', 'columbus'] },
  { id: 'warrior', name: 'Warrior', alpha_acid_min: 15.0, alpha_acid_max: 17.0, beta_acid_min: 4.5, beta_acid_max: 5.5, usage: 'bittering', flavor: ['Clean bittering', 'Mild citrus'], origin: 'US', substitutes: ['magnum', 'nugget'] },
  { id: 'el-dorado', name: 'El Dorado', alpha_acid_min: 14.0, alpha_acid_max: 16.0, beta_acid_min: 7.0, beta_acid_max: 8.0, usage: 'dual', flavor: ['Tropical', 'Pear', 'Watermelon', 'Stone fruit', 'Candy'], origin: 'US', substitutes: ['citra', 'galaxy'] },
  { id: 'sabro', name: 'Sabro', alpha_acid_min: 12.0, alpha_acid_max: 16.0, beta_acid_min: 4.0, beta_acid_max: 5.0, usage: 'aroma', flavor: ['Coconut', 'Tangerine', 'Tropical', 'Cream', 'Cedar'], origin: 'US', substitutes: ['mosaic'] },
  { id: 'strata', name: 'Strata', alpha_acid_min: 11.0, alpha_acid_max: 15.0, beta_acid_min: 5.0, beta_acid_max: 7.0, usage: 'dual', flavor: ['Passion fruit', 'Cannabis', 'Strawberry', 'Dank', 'Grapefruit'], origin: 'US', substitutes: ['mosaic', 'simcoe'] },
  { id: 'idaho-7', name: 'Idaho 7', alpha_acid_min: 13.0, alpha_acid_max: 17.0, beta_acid_min: 4.0, beta_acid_max: 5.5, usage: 'dual', flavor: ['Tropical', 'Pine', 'Black tea', 'Apricot', 'Citrus'], origin: 'US', substitutes: ['simcoe', 'citra'] },
  { id: 'ekuanot', name: 'Ekuanot (HBC 366)', alpha_acid_min: 13.5, alpha_acid_max: 15.5, beta_acid_min: 4.5, beta_acid_max: 5.5, usage: 'dual', flavor: ['Melon', 'Citrus', 'Berry', 'Pepper', 'Pine'], origin: 'US', substitutes: ['simcoe'] },
  { id: 'azacca', name: 'Azacca', alpha_acid_min: 14.0, alpha_acid_max: 16.0, beta_acid_min: 4.0, beta_acid_max: 5.5, usage: 'dual', flavor: ['Mango', 'Citrus', 'Tropical fruit', 'Pineapple'], origin: 'US', substitutes: ['citra', 'amarillo'] },
  { id: 'sultana', name: 'Sultana', alpha_acid_min: 6.0, alpha_acid_max: 9.0, beta_acid_min: 3.0, beta_acid_max: 5.0, usage: 'aroma', flavor: ['Tangerine', 'Pine', 'Pineapple', 'Cream'], origin: 'US', substitutes: ['cascade'] },

  // ── Australian / New Zealand ──────────────────────────────
  { id: 'galaxy', name: 'Galaxy', alpha_acid_min: 13.5, alpha_acid_max: 15.0, beta_acid_min: 5.0, beta_acid_max: 6.0, usage: 'dual', flavor: ['Passion fruit', 'Peach', 'Citrus', 'Pineapple'], origin: 'AU', substitutes: ['citra', 'el-dorado'] },
  { id: 'nelson-sauvin', name: 'Nelson Sauvin', alpha_acid_min: 12.0, alpha_acid_max: 13.0, beta_acid_min: 6.0, beta_acid_max: 8.0, usage: 'dual', flavor: ['White wine', 'Gooseberry', 'Grapefruit', 'Lychee'], origin: 'NZ', substitutes: ['galaxy'] },
  { id: 'motueka', name: 'Motueka', alpha_acid_min: 6.5, alpha_acid_max: 7.5, beta_acid_min: 5.0, beta_acid_max: 5.5, usage: 'aroma', flavor: ['Lime', 'Tropical', 'Lemon', 'Mojito-like'], origin: 'NZ', substitutes: ['cascade'] },
  { id: 'vic-secret', name: 'Vic Secret', alpha_acid_min: 14.0, alpha_acid_max: 17.0, beta_acid_min: 6.0, beta_acid_max: 7.0, usage: 'dual', flavor: ['Pine', 'Passion fruit', 'Pineapple', 'Herbs'], origin: 'AU', substitutes: ['galaxy', 'simcoe'] },

  // ── European - German ─────────────────────────────────────
  { id: 'magnum', name: 'Magnum', alpha_acid_min: 12.0, alpha_acid_max: 14.0, beta_acid_min: 4.5, beta_acid_max: 5.5, usage: 'bittering', flavor: ['Clean bittering', 'Subtle spice'], origin: 'DE', substitutes: ['warrior', 'nugget'] },
  { id: 'hallertau-mittelfrueh', name: 'Hallertau Mittelfrüh', alpha_acid_min: 3.0, alpha_acid_max: 5.5, beta_acid_min: 3.0, beta_acid_max: 4.5, usage: 'aroma', flavor: ['Floral', 'Herbal', 'Spicy', 'Noble', 'Delicate'], origin: 'DE', substitutes: ['hallertau-tradition', 'tettnang'] },
  { id: 'hallertau-tradition', name: 'Hallertau Tradition', alpha_acid_min: 5.0, alpha_acid_max: 7.0, beta_acid_min: 4.0, beta_acid_max: 5.0, usage: 'aroma', flavor: ['Floral', 'Herbal', 'Grassy', 'Noble character'], origin: 'DE', substitutes: ['hallertau-mittelfrueh'] },
  { id: 'hallertau-blanc', name: 'Hallertau Blanc', alpha_acid_min: 9.0, alpha_acid_max: 12.0, beta_acid_min: 4.0, beta_acid_max: 5.0, usage: 'dual', flavor: ['Wine-like', 'White grape', 'Pineapple', 'Gooseberry'], origin: 'DE', substitutes: ['nelson-sauvin'] },
  { id: 'tettnang', name: 'Tettnanger', alpha_acid_min: 3.5, alpha_acid_max: 5.5, beta_acid_min: 3.0, beta_acid_max: 4.5, usage: 'aroma', flavor: ['Mild spice', 'Floral', 'Herbal', 'Noble'], origin: 'DE', substitutes: ['hallertau-mittelfrueh', 'saaz'] },
  { id: 'perle', name: 'Perle', alpha_acid_min: 6.0, alpha_acid_max: 8.5, beta_acid_min: 2.5, beta_acid_max: 4.5, usage: 'dual', flavor: ['Spicy', 'Herbal', 'Clean bittering', 'Mint'], origin: 'DE', substitutes: ['tettnang'] },
  { id: 'huell-melon', name: 'Hüll Melon', alpha_acid_min: 6.9, alpha_acid_max: 7.5, beta_acid_min: 6.0, beta_acid_max: 6.8, usage: 'aroma', flavor: ['Melon', 'Honeydew', 'Strawberry', 'Floral'], origin: 'DE', substitutes: [] },
  { id: 'mandarina-bavaria', name: 'Mandarina Bavaria', alpha_acid_min: 7.0, alpha_acid_max: 10.0, beta_acid_min: 5.0, beta_acid_max: 6.5, usage: 'aroma', flavor: ['Tangerine', 'Mandarin', 'Citrus', 'Sweet'], origin: 'DE', substitutes: ['cascade', 'amarillo'] },
  { id: 'spalter-select', name: 'Spalter Select', alpha_acid_min: 4.0, alpha_acid_max: 6.0, beta_acid_min: 2.5, beta_acid_max: 4.0, usage: 'aroma', flavor: ['Delicate spice', 'Floral', 'Noble', 'Earthy'], origin: 'DE', substitutes: ['saaz', 'tettnang'] },
  { id: 'hersbrucker', name: 'Hersbrucker', alpha_acid_min: 2.0, alpha_acid_max: 5.0, beta_acid_min: 4.0, beta_acid_max: 6.0, usage: 'aroma', flavor: ['Floral', 'Spicy', 'Fruit', 'Mild'], origin: 'DE', substitutes: ['tettnang', 'hallertau-mittelfrueh'] },

  // ── European - Czech ──────────────────────────────────────
  { id: 'saaz', name: 'Saaz', alpha_acid_min: 3.0, alpha_acid_max: 4.5, beta_acid_min: 3.0, beta_acid_max: 4.5, usage: 'aroma', flavor: ['Spicy', 'Herbal', 'Earthy', 'Noble', 'Classic Pilsner'], origin: 'CZ', substitutes: ['tettnang', 'hallertau-mittelfrueh'] },

  // ── European - UK ─────────────────────────────────────────
  { id: 'east-kent-goldings', name: 'East Kent Goldings', alpha_acid_min: 4.5, alpha_acid_max: 6.5, beta_acid_min: 2.0, beta_acid_max: 3.5, usage: 'aroma', flavor: ['Earthy', 'Floral', 'Honey', 'Spicy', 'Classic English'], origin: 'GB', substitutes: ['fuggle'] },
  { id: 'fuggle', name: 'Fuggle', alpha_acid_min: 3.5, alpha_acid_max: 5.5, beta_acid_min: 1.5, beta_acid_max: 3.0, usage: 'aroma', flavor: ['Earthy', 'Woody', 'Mild fruit', 'Classic English'], origin: 'GB', substitutes: ['east-kent-goldings', 'willamette'] },
  { id: 'challenger', name: 'Challenger', alpha_acid_min: 6.5, alpha_acid_max: 8.5, beta_acid_min: 3.0, beta_acid_max: 4.5, usage: 'dual', flavor: ['Spicy', 'Cedar', 'Green tea', 'Marmalade'], origin: 'GB', substitutes: ['east-kent-goldings', 'perle'] },
  { id: 'willamette', name: 'Willamette', alpha_acid_min: 4.0, alpha_acid_max: 6.0, beta_acid_min: 3.0, beta_acid_max: 4.0, usage: 'aroma', flavor: ['Floral', 'Woody', 'Earthy', 'Herbal', 'Spicy'], origin: 'US', substitutes: ['fuggle'] },

  // ── Experimental / Hot New Varieties ───────────────────────
  { id: 'nectaron', name: 'Nectaron', alpha_acid_min: 12.0, alpha_acid_max: 14.0, beta_acid_min: 4.0, beta_acid_max: 6.0, usage: 'aroma', flavor: ['Pineapple', 'Stone fruit', 'Tropical', 'Gummy bears'], origin: 'NZ', substitutes: ['nelson-sauvin', 'galaxy'] },
  { id: 'talus', name: 'Talus', alpha_acid_min: 10.0, alpha_acid_max: 14.0, beta_acid_min: 5.0, beta_acid_max: 7.0, usage: 'dual', flavor: ['Pink grapefruit', 'Coconut', 'Resin', 'Stone fruit'], origin: 'US', substitutes: ['simcoe', 'sabro'] },
  { id: 'cryo-citra', name: 'Cryo Citra', alpha_acid_min: 22.0, alpha_acid_max: 26.0, beta_acid_min: 7.0, beta_acid_max: 9.0, usage: 'aroma', flavor: ['Intense tropical', 'Mango', 'Passion fruit', 'Concentrated Citra'], origin: 'US', substitutes: ['citra'] },
  { id: 'cryo-mosaic', name: 'Cryo Mosaic', alpha_acid_min: 23.0, alpha_acid_max: 27.0, beta_acid_min: 6.0, beta_acid_max: 8.0, usage: 'aroma', flavor: ['Intense berry', 'Tropical', 'Concentrated Mosaic'], origin: 'US', substitutes: ['mosaic'] },
]

/** Quick lookup by ID */
export const HOP_MAP = Object.fromEntries(HOP_DATABASE.map(h => [h.id, h]))

/** Unique origins */
export const HOP_ORIGINS = [...new Set(HOP_DATABASE.map(h => h.origin))]
