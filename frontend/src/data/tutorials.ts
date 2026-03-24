// src/data/tutorials.ts — Brew Academy tutorial library

/* ── Types ────────────────────────────────────────────────────────────────── */

export type TutorialCategory =
  | 'basics'
  | 'mashing'
  | 'boil'
  | 'fermentation'
  | 'packaging'
  | 'advanced'
  | 'troubleshooting'

export type BrewPhase = 'mash' | 'boil' | 'fermentation' | 'packaging'

export type IssueSeverity = 'info' | 'warning' | 'critical'

export interface Tutorial {
  id: string
  title: string
  description: string
  category: TutorialCategory
  duration: number          // seconds
  thumbnail: string         // emoji or url
  tags: string[]
  relatedPhase?: BrewPhase
  lang: 'es' | 'en' | 'both'
  /** Error conditions that auto-trigger this video */
  triggerConditions?: string[]
}

export interface VisionIssue {
  id: string
  severity: IssueSeverity
  phase: BrewPhase
  description: string
  correction: string
  avatarResponse: string
  relatedTutorialId?: string
}

export interface VisionAnalysis {
  phase: BrewPhase
  observations: string[]
  issues: VisionIssue[]
  recommendations: string[]
  confidence: number
}

/* ── Category metadata ────────────────────────────────────────────────────── */

export const CATEGORY_META: Record<TutorialCategory, {
  label: string
  emoji: string
  color: string
  description: string
}> = {
  basics: {
    label: 'Fundamentos',
    emoji: '📚',
    color: '#42A5F5',
    description: 'Equipo, limpieza, química del agua',
  },
  mashing: {
    label: 'Macerado',
    emoji: '🌾',
    color: '#F5A623',
    description: 'Step mash, decocción, BIAB, ajustes de agua',
  },
  boil: {
    label: 'Hervido',
    emoji: '🔥',
    color: '#EF5350',
    description: 'Adiciones de lúpulo, whirlpool, enfriamiento',
  },
  fermentation: {
    label: 'Fermentación',
    emoji: '🧪',
    color: '#7CB342',
    description: 'Inoculación, control de temperatura, dry hopping',
  },
  packaging: {
    label: 'Envasado',
    emoji: '📦',
    color: '#D4723C',
    description: 'Embotellado, embarrilado, carbonatación',
  },
  advanced: {
    label: 'Avanzado',
    emoji: '🧬',
    color: '#9C6ADE',
    description: 'Sour brewing, barrel aging, blending',
  },
  troubleshooting: {
    label: 'Resolución',
    emoji: '🔧',
    color: '#EF5350',
    description: 'Off-flavors, fermentación estancada, turbidez',
  },
}

/* ── Tutorial library ─────────────────────────────────────────────────────── */

export const TUTORIALS: Tutorial[] = [
  // ── Basics ──
  {
    id: 'basics-equipment',
    title: 'Equipamiento esencial para empezar',
    description: 'Todo lo que necesitas para tu primera elaboración: olla, fermentador, termómetro, densímetro y más.',
    category: 'basics',
    duration: 75,
    thumbnail: '🛠️',
    tags: ['equipo', 'principiante', 'setup'],
    lang: 'both',
  },
  {
    id: 'basics-cleaning',
    title: 'Limpieza y sanitización',
    description: 'La diferencia entre limpiar y sanitizar, productos recomendados (StarSan, PBW) y técnicas correctas.',
    category: 'basics',
    duration: 60,
    thumbnail: '🧴',
    tags: ['limpieza', 'sanitización', 'starsan', 'pbw'],
    lang: 'both',
    triggerConditions: ['contamination_risk', 'pre_brew_checklist'],
  },
  {
    id: 'basics-water-intro',
    title: 'Química del agua para cerveceros',
    description: 'Entiende Ca, Mg, SO₄, Cl, bicarbonato y pH. Cómo afectan al sabor de tu cerveza.',
    category: 'basics',
    duration: 90,
    thumbnail: '💧',
    tags: ['agua', 'química', 'minerales', 'pH'],
    lang: 'both',
  },
  {
    id: 'basics-ingredients',
    title: 'Los 4 ingredientes de la cerveza',
    description: 'Malta, lúpulo, levadura y agua: roles, tipos y cómo elegirlos para cada estilo.',
    category: 'basics',
    duration: 80,
    thumbnail: '🍺',
    tags: ['ingredientes', 'malta', 'lúpulo', 'levadura'],
    lang: 'both',
  },

  // ── Mashing ──
  {
    id: 'mash-dough-in',
    title: 'Técnica de empaste (Dough-In)',
    description: 'Cómo añadir el grano al agua caliente sin grumos, temperatura correcta y ratio agua/grano.',
    category: 'mashing',
    duration: 45,
    thumbnail: '🌾',
    tags: ['empaste', 'dough-in', 'mash'],
    relatedPhase: 'mash',
    lang: 'both',
    triggerConditions: ['dough_balls_detected', 'mash_start'],
  },
  {
    id: 'mash-temperature',
    title: 'Temperaturas de macerado y su efecto',
    description: '62°C vs 68°C vs 72°C: cómo la temperatura afecta al cuerpo, atenuación y dulzor.',
    category: 'mashing',
    duration: 60,
    thumbnail: '🌡️',
    tags: ['temperatura', 'enzimas', 'beta-amilasa', 'alfa-amilasa'],
    relatedPhase: 'mash',
    lang: 'both',
    triggerConditions: ['mash_temp_high', 'mash_temp_low'],
  },
  {
    id: 'mash-vorlauf',
    title: 'Vorlauf (Recirculación)',
    description: 'Recircula el mosto hasta que salga claro. Técnica para evitar grano en el hervido.',
    category: 'mashing',
    duration: 40,
    thumbnail: '🔄',
    tags: ['vorlauf', 'recirculación', 'claridad'],
    relatedPhase: 'mash',
    lang: 'both',
  },
  {
    id: 'mash-step-mash',
    title: 'Macerado escalonado (Step Mash)',
    description: 'Protein rest, beta rest, alpha rest y mash-out. Cuándo usar escalones y cuándo no.',
    category: 'mashing',
    duration: 75,
    thumbnail: '📈',
    tags: ['step mash', 'escalones', 'protein rest'],
    relatedPhase: 'mash',
    lang: 'both',
  },
  {
    id: 'mash-biab',
    title: 'BIAB (Brew In A Bag)',
    description: 'Todo en una olla con bolsa de manta. Eficiencia, squeeze o no squeeze, ajustes de agua.',
    category: 'mashing',
    duration: 60,
    thumbnail: '👜',
    tags: ['BIAB', 'bolsa', 'todo grano simplificado'],
    relatedPhase: 'mash',
    lang: 'both',
  },

  // ── Boil ──
  {
    id: 'boil-rolling',
    title: 'Hervido vigoroso correcto',
    description: 'Qué es un "rolling boil", por qué importa para el hot break y DMS, y cómo reconocerlo.',
    category: 'boil',
    duration: 35,
    thumbnail: '🔥',
    tags: ['hervido', 'rolling boil', 'hot break', 'DMS'],
    relatedPhase: 'boil',
    lang: 'both',
    triggerConditions: ['weak_boil_detected', 'boil_start'],
  },
  {
    id: 'boil-hop-additions',
    title: 'Adiciones de lúpulo: timing y efecto',
    description: '60min (amargor), 15min (sabor), 5min/flame-out (aroma). IBU vs utilización.',
    category: 'boil',
    duration: 55,
    thumbnail: '🌿',
    tags: ['lúpulo', 'amargor', 'IBU', 'aroma', 'timing'],
    relatedPhase: 'boil',
    lang: 'both',
    triggerConditions: ['hop_addition_early', 'hop_addition_late'],
  },
  {
    id: 'boil-whirlpool',
    title: 'Whirlpool y hop stand',
    description: 'Remolino para separar trub, adiciones de lúpulo a 80°C para aroma máximo sin amargor.',
    category: 'boil',
    duration: 50,
    thumbnail: '🌀',
    tags: ['whirlpool', 'hop stand', 'aroma'],
    relatedPhase: 'boil',
    lang: 'both',
  },
  {
    id: 'boil-chilling',
    title: 'Enfriamiento rápido del mosto',
    description: 'Serpentín de inmersión, contraflujo, placas: pros/contras. Cold break y window of infection.',
    category: 'boil',
    duration: 65,
    thumbnail: '❄️',
    tags: ['enfriamiento', 'serpentín', 'cold break'],
    relatedPhase: 'boil',
    lang: 'both',
  },

  // ── Fermentation ──
  {
    id: 'ferm-pitching',
    title: 'Inoculación de levadura',
    description: 'Rehidratación de seca, starter de líquida, conteo celular, temperatura de pitching.',
    category: 'fermentation',
    duration: 70,
    thumbnail: '🦠',
    tags: ['levadura', 'pitching', 'inoculación', 'starter'],
    relatedPhase: 'fermentation',
    lang: 'both',
    triggerConditions: ['pitching_temp_high'],
  },
  {
    id: 'ferm-temp-control',
    title: 'Control de temperatura en fermentación',
    description: 'Por qué 18°C para ales y 10°C para lagers. DIY: cámara con termostato.',
    category: 'fermentation',
    duration: 55,
    thumbnail: '🌡️',
    tags: ['temperatura', 'fermentación', 'cámara', 'termostato'],
    relatedPhase: 'fermentation',
    lang: 'both',
    triggerConditions: ['ferm_temp_high', 'ferm_temp_low'],
  },
  {
    id: 'ferm-dry-hop',
    title: 'Dry hopping: técnicas y timing',
    description: 'Cuando añadir, cuánto tiempo, hop creep, biotransformación. Bolsa vs suelto.',
    category: 'fermentation',
    duration: 60,
    thumbnail: '🌿',
    tags: ['dry hop', 'aroma', 'biotransformación'],
    relatedPhase: 'fermentation',
    lang: 'both',
  },
  {
    id: 'ferm-gravity-reading',
    title: 'Lectura de densidad correcta',
    description: 'Densímetro vs refractómetro. Corrección por temperatura. OG, FG y cálculo de ABV.',
    category: 'fermentation',
    duration: 50,
    thumbnail: '📏',
    tags: ['densidad', 'gravedad', 'OG', 'FG', 'ABV'],
    relatedPhase: 'fermentation',
    lang: 'both',
    triggerConditions: ['gravity_stalled'],
  },

  // ── Packaging ──
  {
    id: 'pkg-bottling',
    title: 'Embotellado con priming',
    description: 'Cálculo de azúcar de cebado, llenado correcto, encapsulado y acondicionamiento.',
    category: 'packaging',
    duration: 65,
    thumbnail: '🍾',
    tags: ['embotellado', 'priming', 'carbonatación natural'],
    relatedPhase: 'packaging',
    lang: 'both',
  },
  {
    id: 'pkg-kegging',
    title: 'Embarrilado y carbonatación forzada',
    description: 'Limpieza del corny, purga con CO₂, tabla de presiones por temperatura, set & forget vs burst.',
    category: 'packaging',
    duration: 70,
    thumbnail: '🛢️',
    tags: ['kegging', 'CO2', 'carbonatación forzada', 'corny'],
    relatedPhase: 'packaging',
    lang: 'both',
  },
  {
    id: 'pkg-carbonation',
    title: 'Niveles de carbonatación por estilo',
    description: 'De 1.5 vol (British) a 3.5 vol (Hefeweizen). Tabla de referencia y ajuste de PSI.',
    category: 'packaging',
    duration: 45,
    thumbnail: '💨',
    tags: ['carbonatación', 'volúmenes CO2', 'PSI'],
    relatedPhase: 'packaging',
    lang: 'both',
  },

  // ── Advanced ──
  {
    id: 'adv-sour',
    title: 'Sour brewing: Kettle Sour y Mixed Ferm',
    description: 'Lactobacillus pre-boil, Brettanomyces en secundario, frutas, blending.',
    category: 'advanced',
    duration: 90,
    thumbnail: '🧫',
    tags: ['sour', 'lacto', 'brett', 'kettle sour'],
    lang: 'both',
  },
  {
    id: 'adv-barrel',
    title: 'Barrel Aging en casa',
    description: 'Chips vs espiral vs barrica pequeña. Maderas, tostados, tiempos de contacto.',
    category: 'advanced',
    duration: 75,
    thumbnail: '🪵',
    tags: ['barrel aging', 'madera', 'roble', 'whisky barrel'],
    lang: 'both',
  },
  {
    id: 'adv-decoction',
    title: 'Decocción: el macerado tradicional alemán',
    description: 'Single, double y triple decocción. Melanoidinas, color y sabor a malta.',
    category: 'advanced',
    duration: 80,
    thumbnail: '🇩🇪',
    tags: ['decocción', 'alemán', 'melanoidinas'],
    relatedPhase: 'mash',
    lang: 'both',
  },

  // ── Troubleshooting ──
  {
    id: 'fix-off-flavors',
    title: 'Off-flavors: identifica y corrige',
    description: 'Diacetilo (mantequilla), acetaldehído (manzana verde), DMS (maíz), fenoles (medicinal).',
    category: 'troubleshooting',
    duration: 90,
    thumbnail: '👃',
    tags: ['off-flavors', 'diacetilo', 'DMS', 'acetaldehído'],
    lang: 'both',
    triggerConditions: ['diacetyl_rest_needed'],
  },
  {
    id: 'fix-stalled-ferm',
    title: 'Fermentación estancada',
    description: 'Causas (temperatura, pitching rate, nutrientes) y soluciones (agitar, repitch, nutrientes).',
    category: 'troubleshooting',
    duration: 60,
    thumbnail: '⏸️',
    tags: ['estancada', 'stalled', 'fermentación'],
    relatedPhase: 'fermentation',
    lang: 'both',
    triggerConditions: ['gravity_stalled', 'no_activity_48h'],
  },
  {
    id: 'fix-haze',
    title: 'Turbidez: causas y clarificantes',
    description: 'Chill haze vs permanent haze. Whirlfloc, gelatina, cold crash, PVPP.',
    category: 'troubleshooting',
    duration: 55,
    thumbnail: '🌫️',
    tags: ['turbidez', 'haze', 'clarificante', 'gelatina'],
    lang: 'both',
  },
  {
    id: 'fix-infection',
    title: 'Infección: ¿está mi cerveza contaminada?',
    description: 'Pellicle vs krausen normal. Sabores acéticos vs lácticos. ¿Se puede salvar?',
    category: 'troubleshooting',
    duration: 50,
    thumbnail: '🦠',
    tags: ['infección', 'pellicle', 'contaminación'],
    relatedPhase: 'fermentation',
    lang: 'both',
    triggerConditions: ['contamination_suspected'],
  },
]

/* ── AI Vision issues library ─────────────────────────────────────────────── */

export const VISION_ISSUES: VisionIssue[] = [
  {
    id: 'vi-weak-boil',
    severity: 'warning',
    phase: 'boil',
    description: 'El hervido no parece lo suficientemente vigoroso.',
    correction: 'Sube la potencia del quemador. Un "rolling boil" fuerte es esencial para eliminar DMS y lograr buen hot break.',
    avatarResponse: '¡Ojo! Ese hervido está flojito. Necesitas un rolling boil fuerte para eliminar el DMS. Mira este vídeo rápido...',
    relatedTutorialId: 'boil-rolling',
  },
  {
    id: 'vi-dough-balls',
    severity: 'warning',
    phase: 'mash',
    description: 'Se detectan grumos en el macerado (dough balls).',
    correction: 'Remueve vigorosamente para deshacer los grumos. Añade el grano más lento la próxima vez.',
    avatarResponse: '¡Veo grumos en tu macerado! Remueve bien para romperlos. El grano seco atrapado no va a convertir almidón. Mira cómo se hace...',
    relatedTutorialId: 'mash-dough-in',
  },
  {
    id: 'vi-mash-temp-high',
    severity: 'info',
    phase: 'mash',
    description: 'Temperatura de macerado por encima de 70°C.',
    correction: 'A esta temperatura dominan las alfa-amilasas → cerveza con más cuerpo y menos atenuación.',
    avatarResponse: 'Tu macerado está a más de 70°C — vas a obtener una cerveza con bastante cuerpo y dulzor residual. ¿Es intencional para este estilo?',
    relatedTutorialId: 'mash-temperature',
  },
  {
    id: 'vi-mash-temp-low',
    severity: 'info',
    phase: 'mash',
    description: 'Temperatura de macerado por debajo de 63°C.',
    correction: 'A esta temperatura dominan las beta-amilasas → cerveza más seca y atenuada.',
    avatarResponse: 'El macerado está bastante bajo, por debajo de 63°C. Tendrás mucha atenuación y un cuerpo ligero. Puede ser perfecto para una Saison o Brut IPA.',
    relatedTutorialId: 'mash-temperature',
  },
  {
    id: 'vi-hot-break-weak',
    severity: 'warning',
    phase: 'boil',
    description: 'El hot break parece débil o ausente.',
    correction: 'Asegúrate de tener un hervido vigoroso durante los primeros 15 minutos. El hot break precipita proteínas.',
    avatarResponse: 'No veo mucho hot break... Eso suele pasar cuando el hervido no es suficientemente fuerte. Sube la potencia.',
    relatedTutorialId: 'boil-rolling',
  },
  {
    id: 'vi-krausen-abnormal',
    severity: 'warning',
    phase: 'fermentation',
    description: 'El kräusen presenta apariencia inusual (posible pellicle).',
    correction: 'Un kräusen normal es espumoso y marrón/verde claro. Una película lisa o con burbujas puede indicar infección.',
    avatarResponse: '¡Hmm! Ese kräusen no tiene pinta normal. ¿Ves esa película lisa? Podría ser una pellicle. No entres en pánico, pero mira este vídeo...',
    relatedTutorialId: 'fix-infection',
  },
  {
    id: 'vi-pitching-temp',
    severity: 'critical',
    phase: 'fermentation',
    description: 'Temperatura de inoculación demasiado alta (>30°C).',
    correction: 'Espera a que el mosto baje por debajo de 25°C (ales) o 15°C (lagers) antes de inocular.',
    avatarResponse: '¡Para! El mosto está demasiado caliente para inocular. Vas a estresar la levadura y producir off-flavors. Enfría primero.',
    relatedTutorialId: 'ferm-pitching',
  },
  {
    id: 'vi-gravity-stalled',
    severity: 'warning',
    phase: 'fermentation',
    description: 'La gravedad no ha bajado en 48+ horas.',
    correction: 'Sube la temperatura 2-3°C, agita suavemente el fermentador, o añade nutrientes.',
    avatarResponse: 'La densidad lleva parada un buen rato. Prueba a subir la temperatura un par de grados y darle un meneo suave al fermentador.',
    relatedTutorialId: 'fix-stalled-ferm',
  },
]
