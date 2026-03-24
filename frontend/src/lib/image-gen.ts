// frontend/src/lib/image-gen.ts — Together.ai 3D Asset Generation Pipeline
// Generates isometric 3D illustrations for equipment across the app.
// Images are cached in localStorage after first generation.

const TOGETHER_API = 'https://api.together.xyz/v1/images/generations'

const STYLE_PROMPT = `Isometric 3D render, clean white background for transparency, soft studio lighting, Pixar-meets-technical-illustration style, subtle shadows, high-end product visualization, 8k resolution`

export const EQUIPMENT_PROMPTS: Record<string, string> = {
  fermzilla_55: `${STYLE_PROMPT}, FermZilla 55L Gen 2 conical pressure fermenter, clear PET body showing amber beer inside, stainless steel fittings, collection ball at bottom, floating dip tube visible`,
  fermzilla_27: `${STYLE_PROMPT}, FermZilla 27L Gen 2 smaller conical fermenter, clear PET body showing golden beer, stainless fittings, pressure gauge visible`,
  ss_brewbucket: `${STYLE_PROMPT}, SS Brewtech Brew Bucket 7 gallon stainless steel fermenter, conical bottom, thermowell, brushed steel finish`,
  corny_keg_19: `${STYLE_PROMPT}, Cornelius keg 19L ball lock, stainless steel, with disconnects attached, slight condensation on surface`,
  keezer_4tap: `${STYLE_PROMPT}, Custom keezer (chest freezer with wooden collar and 4 beer taps), taps are chrome with black handles, wooden collar is dark walnut`,
  brewing_kettle: `${STYLE_PROMPT}, 50L stainless steel brewing kettle with ball valve, thermometer, and tri-clamp fittings`,
  ispindel: `${STYLE_PROMPT}, iSpindel digital hydrometer, transparent cylinder floating at 45 degree angle in amber beer inside a fermenter, LED glowing green`,
  mash_tun: `${STYLE_PROMPT}, Stainless steel mash tun with false bottom, recirculation arm, thermometer, and sight glass showing grain and wort`,
  plate_chiller: `${STYLE_PROMPT}, Stainless steel plate chiller for wort cooling, compact industrial design with input/output ports`,
  bottling_line: `${STYLE_PROMPT}, Small-scale bottling setup with crown capper, amber glass bottles, and a bottle tree drainer`,
}

interface GenerateImageOptions {
  prompt: string
  width?: number
  height?: number
  model?: string
}

interface TogetherImageResponse {
  data: Array<{ url: string; b64_json?: string }>
}

const CACHE_PREFIX = 'beergate_3d_'

export async function generateImage(
  apiKey: string,
  { prompt, width = 1024, height = 1024, model = 'black-forest-labs/FLUX.1-schnell' }: GenerateImageOptions
): Promise<string> {
  const response = await fetch(TOGETHER_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      prompt,
      width,
      height,
      n: 1,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Together.ai API error: ${response.status} — ${error}`)
  }

  const result = (await response.json()) as TogetherImageResponse
  const url = result.data[0]?.url
  if (!url) throw new Error('Together.ai returned no image')
  return url
}

export async function generateEquipmentImage(
  apiKey: string,
  equipmentId: keyof typeof EQUIPMENT_PROMPTS
): Promise<string> {
  const cacheKey = `${CACHE_PREFIX}${equipmentId}`
  const cached = localStorage.getItem(cacheKey)
  if (cached) return cached

  const prompt = EQUIPMENT_PROMPTS[equipmentId]
  if (!prompt) throw new Error(`Unknown equipment: ${equipmentId}`)

  const url = await generateImage(apiKey, { prompt })
  localStorage.setItem(cacheKey, url)
  return url
}

export function getCachedImage(equipmentId: string): string | null {
  return localStorage.getItem(`${CACHE_PREFIX}${equipmentId}`)
}

export function clearImageCache(): void {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX))
  keys.forEach(k => localStorage.removeItem(k))
}

// Fallback SVG placeholder for when API is unavailable
export function getPlaceholderSvg(equipmentId: string): string {
  return `/assets/3d/${equipmentId}.svg`
}
