// frontend/src/lib/brew-calc.ts — Brewing calculator formulas for Beergate v3

/* ── OG / Extract ────────────────────────────────────────────── */

/**
 * Calculate Original Gravity from grain bill.
 * Uses PPG (Points Per Pound Per Gallon) converted to metric.
 * potential_sg is like 1.037 → 37 PPG
 */
export function calcOG(
  fermentables: { amount_kg: number; potential_sg: number; pct_usage?: number }[],
  batch_liters: number,
  efficiency_pct: number,
): number {
  if (batch_liters <= 0) return 1.000
  const totalPoints = fermentables.reduce((sum, f) => {
    // Convert kg to lbs, liters to gallons for PPG formula then convert back
    const lbs = f.amount_kg * 2.20462
    const ppg = (f.potential_sg - 1) * 1000
    return sum + lbs * ppg
  }, 0)
  const gallons = batch_liters * 0.264172
  const points = (totalPoints / gallons) * (efficiency_pct / 100)
  return 1 + points / 1000
}

/**
 * Calculate Final Gravity given OG and yeast attenuation
 */
export function calcFG(og: number, attenuation_pct: number): number {
  const ogPoints = (og - 1) * 1000
  const fgPoints = ogPoints * (1 - attenuation_pct / 100)
  return 1 + fgPoints / 1000
}

/* ── ABV ─────────────────────────────────────────────────────── */

/** Standard ABV formula */
export function calcABV(og: number, fg: number): number {
  return (og - fg) * 131.25
}

/** Alternate more accurate ABV formula (Balling/Cutaia) */
export function calcABVAlternate(og: number, fg: number): number {
  return (76.08 * (og - fg)) / (1.775 - og) * (fg / 0.794)
}

/* ── IBU Calculations ────────────────────────────────────────── */

/**
 * Tinseth IBU formula (most widely used)
 */
export function calcIBUTinseth(
  alpha_pct: number,     // e.g. 12.5
  amount_g: number,
  time_min: number,      // boil time
  og: number,
  batch_liters: number,
): number {
  const bignessFactor = 1.65 * Math.pow(0.000125, og - 1)
  const boilTimeFactor = (1 - Math.exp(-0.04 * time_min)) / 4.15
  const utilization = bignessFactor * boilTimeFactor
  const mgl = ((alpha_pct / 100) * amount_g * 1000) / batch_liters
  return utilization * mgl
}

/**
 * Rager IBU formula
 */
export function calcIBURager(
  alpha_pct: number,
  amount_g: number,
  time_min: number,
  og: number,
  batch_liters: number,
): number {
  const utilization = 18.11 + 13.86 * Math.tanh((time_min - 31.32) / 18.27)
  const adjustment = og > 1.050 ? (og - 1.050) / 0.2 : 0
  const oz = amount_g / 28.3495
  const gallons = batch_liters * 0.264172
  return (oz * (utilization / 100) * alpha_pct * 7462) / (gallons * (1 + adjustment))
}

/**
 * Total IBU from multiple hop additions
 */
export function calcTotalIBU(
  hops: { alpha_pct: number; amount_g: number; time_min: number }[],
  og: number,
  batch_liters: number,
  method: 'tinseth' | 'rager' = 'tinseth',
): number {
  const fn = method === 'rager' ? calcIBURager : calcIBUTinseth
  return hops.reduce((total, h) => total + fn(h.alpha_pct, h.amount_g, h.time_min, og, batch_liters), 0)
}

/* ── Color (SRM / EBC) ──────────────────────────────────────── */

/**
 * Morey equation for SRM calculation
 */
export function calcSRM(
  fermentables: { amount_kg: number; color_lovibond: number }[],
  batch_liters: number,
): number {
  if (batch_liters <= 0) return 0
  const gallons = batch_liters * 0.264172
  const mcu = fermentables.reduce((sum, f) => {
    const lbs = f.amount_kg * 2.20462
    return sum + (f.color_lovibond * lbs) / gallons
  }, 0)
  // Morey equation
  return 1.4922 * Math.pow(mcu, 0.6859)
}

/** Convert SRM to EBC */
export function srmToEBC(srm: number): number {
  return srm * 1.97
}

/** Convert EBC to SRM */
export function ebcToSRM(ebc: number): number {
  return ebc / 1.97
}

/**
 * SRM to approximate hex color for visual swatch
 */
export function srmToHex(srm: number): string {
  const clamp = Math.min(Math.max(Math.round(srm), 1), 40)
  const palette: Record<number, string> = {
    1: '#F3F993', 2: '#F5F75C', 3: '#F6F513', 4: '#EAE510',
    5: '#E0D01B', 6: '#D5BC26', 7: '#CDAA37', 8: '#C1963C',
    9: '#BE8C3A', 10: '#BE823A', 11: '#BE7732', 12: '#BE6B25',
    13: '#BE611D', 14: '#BE5716', 15: '#BE4E0F', 16: '#BE430A',
    17: '#B03A05', 18: '#8E2D04', 19: '#701D05', 20: '#5A0F05',
    21: '#4F0E03', 22: '#430C03', 23: '#390A03', 24: '#300802',
    25: '#280702', 26: '#200601', 27: '#180501', 28: '#100300',
    29: '#0C0200', 30: '#080100', 31: '#060100', 32: '#040000',
    33: '#030000', 34: '#020000', 35: '#010000', 40: '#010000',
  }
  return palette[clamp] ?? '#A06010'
}

/* ── Mash & Water ────────────────────────────────────────────── */

/**
 * Strike water temperature calculator
 * @param ratio water-to-grain ratio in L/kg (typically 2.5-3.5)
 * @param grainTemp grain temperature °C (room temp)
 * @param targetTemp target mash temperature °C
 */
export function calcStrikeTemp(ratio: number, grainTemp: number, targetTemp: number): number {
  // Formula: Tw = (0.2/R)(T2-T1) + T2
  // where R = L/kg ratio, T2 = target, T1 = grain temp
  // 0.2 is thermal capacity ratio of grain to water (0.4 cal/g°C / 2.0 conversion factor)
  return ((0.41 / ratio) * (targetTemp - grainTemp)) + targetTemp
}

/**
 * Sparge water volume
 */
export function calcSpargeVolume(
  batch_liters: number,
  grain_kg: number,
  ratio: number,              // L/kg mash ratio
  boiloff_liters_per_hour: number,
  boil_time_min: number,
  trub_loss_liters: number,
): number {
  const mashWater = grain_kg * ratio
  const grainAbsorption = grain_kg * 1.04  // ~1.04 L/kg absorbed
  const boiloff = boiloff_liters_per_hour * (boil_time_min / 60)
  const preboilVolume = batch_liters + boiloff + trub_loss_liters
  return Math.max(0, preboilVolume - mashWater + grainAbsorption)
}

/* ── Carbonation ─────────────────────────────────────────────── */

/**
 * Priming sugar (table sugar / sucrose) in grams
 * @param targetVols target CO2 volumes
 * @param beerTemp beer temperature °C
 * @param volume_liters volume of beer to carbonate
 */
export function calcPrimingSugar(targetVols: number, beerTemp: number, volume_liters: number): number {
  // Residual CO2 from Henry's law approximation
  const residualCO2 = 3.0378 - (0.050062 * beerTemp) + (0.00026555 * beerTemp * beerTemp)
  const neededCO2 = targetVols - residualCO2
  // ~4g sugar per liter per CO2 volume
  return Math.max(0, neededCO2 * volume_liters * 4)
}

/**
 * Forced carbonation PSI at given temperature
 * @param targetVols target CO2 volumes
 * @param tempC beer temperature °C
 */
export function calcForcedCarbPSI(targetVols: number, tempC: number): number {
  const tempF = tempC * 9 / 5 + 32
  // Simplified carbonation equation
  return -16.6999 - (0.0101059 * tempF) + (0.00116512 * tempF * tempF) +
    (0.173354 * targetVols * tempF) + (4.24267 * targetVols) - (0.0684226 * targetVols * targetVols)
}

/* ── Unit Conversions ────────────────────────────────────────── */

export function sgToPlato(sg: number): number {
  return -616.868 + 1111.14 * sg - 630.272 * sg * sg + 135.997 * sg * sg * sg
}

export function platoToSG(plato: number): number {
  return 1 + plato / (258.6 - (plato * 227.1 / 258.2))
}

export function brixToSG(brix: number): number {
  return 1.000019 + (0.003865613 * brix) +
    (0.00001318441 * brix * brix) +
    (0.00000006922 * brix * brix * brix)
}

export function celsiusToFahrenheit(c: number): number { return c * 9 / 5 + 32 }
export function fahrenheitToCelsius(f: number): number { return (f - 32) * 5 / 9 }
export function litersToGallons(l: number): number { return l * 0.264172 }
export function gallonsToLiters(g: number): number { return g * 3.78541 }
export function kgToLbs(kg: number): number { return kg * 2.20462 }
export function lbsToKg(lbs: number): number { return lbs * 0.453592 }
export function gramToOz(g: number): number { return g / 28.3495 }
export function ozToGram(oz: number): number { return oz * 28.3495 }
