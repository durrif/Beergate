// src/lib/beerxml-parser.ts — Client-side BeerXML 1.0 parser for bulk import
import JSZip from 'jszip'
import type { Recipe, RecipeIngredient, MashStep } from './types'

/* ── XML helpers ────────────────────────────────────────────────────────── */

function getTagText(node: Element, tag: string): string | undefined {
  const el = node.getElementsByTagName(tag)[0]
  return el?.textContent?.trim() || undefined
}

function getTagFloat(node: Element, tag: string): number | undefined {
  const raw = getTagText(node, tag)
  return raw ? parseFloat(raw) : undefined
}

function getTagElements(node: Element, tag: string): Element[] {
  return Array.from(node.getElementsByTagName(tag))
}

/* ── Parse a single BeerXML recipe element ──────────────────────────────── */

function parseFermentable(el: Element): RecipeIngredient {
  const amountKg = getTagFloat(el, 'AMOUNT') ?? 0
  return {
    name: getTagText(el, 'NAME') ?? 'Unknown',
    amount_kg: amountKg,
    amount_g: Math.round(amountKg * 1000),
    type: getTagText(el, 'TYPE'),
    color_ebc: getTagFloat(el, 'COLOR') != null
      ? Math.round((getTagFloat(el, 'COLOR')! * 1.97) + 0.5) // Lovibond → EBC
      : undefined,
    origin: getTagText(el, 'ORIGIN'),
  }
}

function parseHop(el: Element): RecipeIngredient {
  const amountKg = getTagFloat(el, 'AMOUNT') ?? 0
  return {
    name: getTagText(el, 'NAME') ?? 'Unknown',
    amount_kg: amountKg,
    amount_g: Math.round(amountKg * 1000),
    alpha_pct: getTagFloat(el, 'ALPHA'),
    time_min: getTagFloat(el, 'TIME'),
    use: getTagText(el, 'USE'),
    form: getTagText(el, 'FORM'),
    origin: getTagText(el, 'ORIGIN'),
  }
}

function parseYeast(el: Element): RecipeIngredient {
  return {
    name: getTagText(el, 'NAME') ?? 'Unknown',
    type: getTagText(el, 'TYPE'),
    form: getTagText(el, 'FORM'),
    lab: getTagText(el, 'LABORATORY'),
    product_id: getTagText(el, 'PRODUCT_ID'),
    attenuation_pct: getTagFloat(el, 'ATTENUATION'),
    min_temp: getTagFloat(el, 'MIN_TEMPERATURE'),
    max_temp: getTagFloat(el, 'MAX_TEMPERATURE'),
  }
}

function parseMashStep(el: Element): MashStep {
  return {
    name: getTagText(el, 'NAME'),
    type: getTagText(el, 'TYPE'),
    temp_c: getTagFloat(el, 'STEP_TEMP') ?? 67,
    duration_min: getTagFloat(el, 'STEP_TIME'),
    time_min: getTagFloat(el, 'STEP_TIME'),
  }
}

function parseRecipeNode(recipeEl: Element): Partial<Recipe> {
  const og = getTagFloat(recipeEl, 'OG')
  const fg = getTagFloat(recipeEl, 'FG')
  const batchSizeL = getTagFloat(recipeEl, 'BATCH_SIZE')

  // Parse fermentables
  const fermentablesContainer = recipeEl.getElementsByTagName('FERMENTABLES')[0]
  const fermentables: RecipeIngredient[] = fermentablesContainer
    ? getTagElements(fermentablesContainer, 'FERMENTABLE').map(parseFermentable)
    : []

  // Parse hops
  const hopsContainer = recipeEl.getElementsByTagName('HOPS')[0]
  const hops: RecipeIngredient[] = hopsContainer
    ? getTagElements(hopsContainer, 'HOP').map(parseHop)
    : []

  // Parse yeasts
  const yeastsContainer = recipeEl.getElementsByTagName('YEASTS')[0]
  const yeasts: RecipeIngredient[] = yeastsContainer
    ? getTagElements(yeastsContainer, 'YEAST').map(parseYeast)
    : []

  // Parse mash steps
  const mashProfile = recipeEl.getElementsByTagName('MASH')[0]
  const mashStepsContainer = mashProfile?.getElementsByTagName('MASH_STEPS')[0]
  const mashSteps: MashStep[] = mashStepsContainer
    ? getTagElements(mashStepsContainer, 'MASH_STEP').map(parseMashStep)
    : []

  // Parse style
  const styleEl = recipeEl.getElementsByTagName('STYLE')[0]
  const styleName = styleEl ? getTagText(styleEl, 'NAME') : undefined
  const styleCode = styleEl
    ? `${getTagText(styleEl, 'CATEGORY_NUMBER') ?? ''}${getTagText(styleEl, 'STYLE_LETTER') ?? ''}`
    : undefined

  // Calculate ABV if OG/FG available
  const abv = og && fg ? Math.round(((og - fg) * 131.25) * 10) / 10 : undefined

  return {
    name: getTagText(recipeEl, 'NAME') ?? 'Untitled Recipe',
    style: styleName,
    style_code: styleCode || undefined,
    description: getTagText(recipeEl, 'NOTES'),
    batch_size_liters: batchSizeL != null ? Math.round(batchSizeL * 10) / 10 : undefined,
    efficiency_pct: getTagFloat(recipeEl, 'EFFICIENCY'),
    og,
    fg,
    abv,
    ibu: getTagFloat(recipeEl, 'IBU'),
    srm: getTagFloat(recipeEl, 'EST_COLOR'),
    fermentables,
    hops,
    yeasts,
    mash_steps: mashSteps.length > 0 ? mashSteps : undefined,
    notes: getTagText(recipeEl, 'NOTES'),
    status: 'draft',
  }
}

/* ── Parse a single BeerXML string ──────────────────────────────────────── */

export function parseBeerXMLString(xmlString: string): Partial<Recipe>[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlString, 'text/xml')

  // Check for XML parse errors
  const parseError = doc.querySelector('parsererror')
  if (parseError) {
    throw new Error(`Invalid XML: ${parseError.textContent?.slice(0, 100)}`)
  }

  const recipes = doc.getElementsByTagName('RECIPE')
  if (recipes.length === 0) {
    throw new Error('No <RECIPE> elements found in BeerXML')
  }

  return Array.from(recipes).map(parseRecipeNode)
}

/* ── Parse a single .xml File ───────────────────────────────────────────── */

export async function parseBeerXMLFile(file: File): Promise<Partial<Recipe>[]> {
  const text = await file.text()
  return parseBeerXMLString(text)
}

/* ── Parse a .zip containing multiple .xml files ─────────────────────── */

export interface BulkImportProgress {
  total: number
  processed: number
  succeeded: number
  failed: number
  currentFile: string
  errors: Array<{ file: string; error: string }>
  recipes: Partial<Recipe>[]
}

export async function parseBeerXMLZip(
  file: File,
  onProgress?: (progress: BulkImportProgress) => void,
): Promise<BulkImportProgress> {
  const zip = await JSZip.loadAsync(file)

  // Find all .xml files in the zip (any level of nesting)
  const xmlFiles: Array<{ name: string; entry: JSZip.JSZipObject }> = []
  zip.forEach((relativePath, zipEntry) => {
    if (
      !zipEntry.dir &&
      relativePath.toLowerCase().endsWith('.xml') &&
      !relativePath.startsWith('__MACOSX') // Skip macOS metadata
    ) {
      xmlFiles.push({ name: relativePath, entry: zipEntry })
    }
  })

  if (xmlFiles.length === 0) {
    throw new Error('No .xml files found in the ZIP archive')
  }

  const progress: BulkImportProgress = {
    total: xmlFiles.length,
    processed: 0,
    succeeded: 0,
    failed: 0,
    currentFile: '',
    errors: [],
    recipes: [],
  }

  for (const { name, entry } of xmlFiles) {
    progress.currentFile = name
    onProgress?.(structuredClone(progress))

    try {
      const xmlText = await entry.async('string')
      const recipes = parseBeerXMLString(xmlText)
      progress.recipes.push(...recipes)
      progress.succeeded++
    } catch (err) {
      progress.failed++
      progress.errors.push({
        file: name,
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    }

    progress.processed++
    onProgress?.(structuredClone(progress))
  }

  return progress
}
