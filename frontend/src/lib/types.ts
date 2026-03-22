// frontend/src/lib/types.ts

export interface User {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'brewer'
  is_active: boolean
  preferred_language: 'es' | 'en'
  brewery_id?: string
  created_at: string
}

export interface Brewery {
  id: string
  name: string
  description?: string
  location?: string
  logo_url?: string
  owner_id: string
  created_at: string
  updated_at: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: 'bearer'
  user?: User
  brewery?: Brewery
}

// Inventory
export type IngredientCategory =
  | 'malta_base'
  | 'malta_especial'
  | 'malta_otra'
  | 'lupulo'
  | 'levadura'
  | 'adjunto'
  | 'otro'

export type IngredientUnit = 'kg' | 'g' | 'l' | 'ml' | 'pkt' | 'unit'

export interface Ingredient {
  id: string
  brewery_id: string
  name: string
  category: IngredientCategory
  quantity: number
  unit: IngredientUnit
  min_stock?: number
  purchase_price?: number
  supplier?: string
  origin?: string
  flavor_profile?: string
  expiry_date?: string
  lot_number?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface IngredientCreate {
  name: string
  category: IngredientCategory
  quantity: number
  unit: IngredientUnit
  min_stock?: number
  purchase_price?: number
  supplier?: string
  origin?: string
  flavor_profile?: string
  expiry_date?: string
  lot_number?: string
  notes?: string
}

export interface IngredientUpdate extends Partial<IngredientCreate> {}

// Recipes
export interface RecipeIngredient {
  name: string
  amount_kg?: number
  amount_g?: number
  alpha_pct?: number
  time_min?: number
  use?: string
  type?: string
  origin?: string
  color_ebc?: number
  form?: string
  lab?: string
  product_id?: string
  attenuation_pct?: number
  min_temp?: number
  max_temp?: number
}

export interface MashStep {
  temp_c: number
  duration_min?: number
  time_min?: number
  name?: string
  type?: string
}

export interface Recipe {
  id: string
  brewery_id: string
  name: string
  style?: string
  style_code?: string
  description?: string
  status: string
  batch_size_liters?: number
  efficiency_pct?: number
  og?: number
  fg?: number
  abv?: number
  ibu?: number
  srm?: number
  ebc?: number
  fermentables?: RecipeIngredient[]
  hops?: RecipeIngredient[]
  yeasts?: RecipeIngredient[]
  adjuncts?: RecipeIngredient[]
  mash_steps?: MashStep[]
  water_profile?: Record<string, unknown>
  notes?: string
  brewers_friend_id?: string
}

// Brew Sessions
export type BrewPhase =
  | 'planned'
  | 'mashing'
  | 'lautering'
  | 'boiling'
  | 'cooling'
  | 'fermenting'
  | 'conditioning'
  | 'packaging'
  | 'completed'
  | 'aborted'

export interface BrewStep {
  id: string
  name: string
  description?: string
  duration_min?: number
  temp_c?: number
  notes?: string
  completed: boolean
  completed_at?: string
}

export interface BrewSession {
  id: string
  brewery_id: string
  recipe_id?: string
  name: string
  batch_number?: number
  phase: BrewPhase
  planned_batch_liters?: number
  actual_batch_liters?: number
  planned_og?: number
  actual_og?: number
  planned_fg?: number
  actual_fg?: number
  actual_abv?: number
  efficiency_pct?: number
  brew_date?: string
  fermentation_start?: string
  packaging_date?: string
  step_log?: Record<string, unknown>[]
  notes?: string
  created_at: string
  updated_at: string
}

// Fermentation
export interface FermentationDataPoint {
  id: string
  session_id: string
  recorded_at: string
  gravity: number
  temperature: number
  angle?: number
  battery?: number
  rssi?: number
  source: string
}

// Alias used by hooks
export type FermentationPoint = FermentationDataPoint

export interface ISpindelReading {
  name: string
  gravity: number
  temperature: number
  angle: number
  battery: number
  rssi: number
  timestamp: string
}

// Prices
export interface PriceRecord {
  ingredient_name: string
  shop_name: string
  shop_url: string
  product_url: string
  product_name: string
  price: number
  unit: string
  price_per_kg: number | null
  in_stock: boolean
  cached: boolean
  scraped_at: string | null
}

// Alias used by hooks
export type PriceResult = PriceRecord

export interface PriceAlert {
  id: number
  brewery_id: number
  ingredient_name: string
  alert_type: 'price_drop' | 'back_in_stock' | 'price_increase'
  threshold_price: number | null
  is_active: boolean
  last_triggered_at: string | null
  created_at: string
}

export interface PriceComparison {
  ingredient_name: string
  cheapest_price: number | null
  cheapest_shop: string | null
  all_offers: PriceRecord[]
}

// Can-brew check result
export interface CanBrewResult {
  status: 'ready' | 'partial' | 'missing'
  missing: Array<{ name: string; required: number; unit: string }>
  low_stock: Array<{ name: string; required: number; available: number; unit: string }>
  available: string[]
}

// AI
export type MessageRole = 'user' | 'assistant' | 'system'

export interface AIMessage {
  id: string
  role: MessageRole
  content: string
  created_at: string
}

export interface AIConversation {
  id: string
  brewery_id: string
  title: string
  messages: AIMessage[]
  context_page?: string
  created_at: string
  updated_at: string
}

// Voice
export interface VoiceCommand {
  text: string
  language?: 'es' | 'en'
  context?: string
}

export interface VoiceCapability {
  command: string
  description: string
  example: string
}

// Water Profile
export interface WaterProfile {
  id: string
  brewery_id: string
  name: string
  calcium_ppm: number
  magnesium_ppm: number
  sodium_ppm: number
  chloride_ppm: number
  sulfate_ppm: number
  bicarbonate_ppm: number
  ph?: number
  source?: string
  created_at: string
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  has_more: boolean
}

// API Error
export interface ApiError {
  detail: string
  status?: number
}
