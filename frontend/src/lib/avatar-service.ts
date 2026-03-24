// frontend/src/lib/avatar-service.ts — Beergate v4 FASE 1
// Service for generating avatars (Together.ai FLUX) and animations (Replicate SadTalker/LivePortrait)

import type { AvatarStyle, PresetCharacter } from '@/stores/avatar-store'

const TOGETHER_API = 'https://api.together.xyz/v1/images/generations'

// Style-specific prompts for avatar generation
const STYLE_MODIFIERS: Record<AvatarStyle, string> = {
  cartoon: "Pixar-meets-modern-3D-render, clean lines, vibrant colors, cartoon proportions",
  realistic: "Hyper-realistic 3D render, photorealistic skin textures, studio lighting, cinematic",
  anime: "Anime art style, clean cel shading, large expressive eyes, Japanese animation quality",
  classic: "Traditional illustration, warm watercolor tones, vintage brewing poster style, hand-drawn feel",
}

// Preset character prompts
const PRESET_PROMPTS: Record<PresetCharacter, string> = {
  maestro: "A wise, bearded master brewer in his 50s, wearing a dark leather apron over a flannel shirt, warm smile, holding a hydrometer, grey beard neatly trimmed, kind eyes",
  cientifica: "A young female scientist with hop-shaped earrings, wearing a white lab coat with amber stains, safety goggles on forehead, short dark hair, confident smirk, holding a flask with golden liquid",
  punk: "A punk brewer with a colorful mohawk, tattoo sleeves of hops and barley, ripped band t-shirt under a brewing apron, piercings, rebellious grin, holding a pint glass",
  hop3000: "A friendly humanoid robot with copper and amber chassis, glowing amber eyes, hop leaf antenna, small LED panels showing brewing data, polished metallic surface with warm patina",
}

/** Generates an avatar image from a photo or preset using Together.ai FLUX */
export async function generateAvatarImage(
  options: {
    style: AvatarStyle
    preset?: PresetCharacter
    /** Base64 data URL of user-uploaded photo (not sent to API for now — used as description context) */
    photoDescription?: string
  }
): Promise<string> {
  const apiKey = import.meta.env.VITE_TOGETHER_API_KEY
  if (!apiKey) {
    throw new Error('VITE_TOGETHER_API_KEY not configured')
  }

  const styleModifier = STYLE_MODIFIERS[options.style]
  const characterDescription = options.preset
    ? PRESET_PROMPTS[options.preset]
    : options.photoDescription ?? 'A charismatic modern brewmaster'

  const prompt = `A charismatic 3D stylized character: ${characterDescription}. 
Wearing a high-quality dark charcoal grey hoodie with subtle orange accents on the drawstrings.
Style: ${styleModifier}. 
Frontal medium shot, friendly and helpful pose.
Solid lime green background (#00FF00) for chroma key extraction.
High resolution, 8k, vibrant colors. --ar 1:1`

  const response = await fetch(TOGETHER_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'black-forest-labs/FLUX.1-schnell',
      prompt,
      width: 1024,
      height: 1024,
      n: 1,
      response_format: 'url',
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Together.ai error: ${err}`)
  }

  const result = await response.json() as { data: Array<{ url?: string }> }
  const url = result.data[0]?.url
  if (!url) throw new Error('No image URL in response')

  return url
}

/** Generate 4 style variants for the user to choose from */
export async function generateStyleOptions(
  preset?: PresetCharacter,
  photoDescription?: string
): Promise<Record<AvatarStyle, string>> {
  const styles: AvatarStyle[] = ['cartoon', 'realistic', 'anime', 'classic']

  // Generate all 4 in parallel
  const results = await Promise.allSettled(
    styles.map((style) =>
      generateAvatarImage({ style, preset, photoDescription })
    )
  )

  const output: Partial<Record<AvatarStyle, string>> = {}
  results.forEach((result, i) => {
    const key = styles[i]
    if (result.status === 'fulfilled' && key) {
      output[key] = result.value
    }
  })

  // Need at least one to succeed
  if (Object.keys(output).length === 0) {
    throw new Error('Failed to generate any style options')
  }

  return output as Record<AvatarStyle, string>
}

/**
 * Generates a talking-head video using the backend proxy to Replicate.
 * The backend should expose a POST /v1/avatar/animate endpoint
 * that calls SadTalker or LivePortrait and returns the video URL.
 */
export async function generateTalkingVideo(
  imageUrl: string,
  audioUrl: string
): Promise<string> {
  const response = await fetch('/api/v1/avatar/animate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source_image: imageUrl,
      driven_audio: audioUrl,
      preprocess: 'crop',
      still_mode: true,
      use_enhancer: true,
      use_eyeblink: true,
      size_of_image: 256,
      expression_scale: 1,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Avatar animation error: ${err}`)
  }

  const result = await response.json() as { video_url: string }
  return result.video_url
}

/**
 * Generates speech audio via the backend proxy to Replicate XTTS-v2.
 * POST /v1/avatar/speak
 */
export async function generateSpeechAudio(
  text: string,
  voiceModelId?: string | null,
  language = 'es'
): Promise<string> {
  const response = await fetch('/api/v1/avatar/speak', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      language,
      speaker_wav: voiceModelId ?? undefined,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Speech generation error: ${err}`)
  }

  const result = await response.json() as { audio_url: string }
  return result.audio_url
}

/**
 * Full pipeline: Text → Audio → Animated Video
 * Falls back to static image + text bubble if video generation fails
 */
export async function generateFullResponse(
  text: string,
  imageUrl: string,
  voiceModelId?: string | null
): Promise<{ audioUrl?: string; videoUrl?: string }> {
  try {
    const audioUrl = await generateSpeechAudio(text, voiceModelId)

    try {
      const videoUrl = await generateTalkingVideo(imageUrl, audioUrl)
      return { audioUrl, videoUrl }
    } catch {
      // Video generation failed — use audio only with static image
      return { audioUrl }
    }
  } catch {
    // Audio generation failed — text-only fallback
    return {}
  }
}
