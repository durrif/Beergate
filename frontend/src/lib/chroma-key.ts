// frontend/src/lib/chroma-key.ts — Beergate v4 FASE 1: Real-time chroma key processor
// Removes green (#00FF00) background from avatar video/image in real-time via Canvas

export interface ChromaKeyOptions {
  /** Minimum green channel value to consider green (0-255) */
  greenThreshold?: number
  /** How much green must exceed red to be considered chroma */
  greenToRedRatio?: number
  /** How much green must exceed blue to be considered chroma */
  greenToBlueRatio?: number
  /** Edge softening radius (0 = hard edge, 1-3 = soft) */
  edgeSoftness?: number
}

const DEFAULT_OPTIONS: Required<ChromaKeyOptions> = {
  greenThreshold: 80,
  greenToRedRatio: 1.3,
  greenToBlueRatio: 1.3,
  edgeSoftness: 1,
}

/**
 * Processes a single frame, replacing green pixels with transparency.
 */
function processFrame(
  imageData: ImageData,
  opts: Required<ChromaKeyOptions>
): void {
  const { data } = imageData
  const { greenThreshold, greenToRedRatio, greenToBlueRatio, edgeSoftness } = opts

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] ?? 0
    const g = data[i + 1] ?? 0
    const b = data[i + 2] ?? 0

    if (
      g > greenThreshold &&
      g > r * greenToRedRatio &&
      g > b * greenToBlueRatio
    ) {
      // Full green → fully transparent
      data[i + 3] = 0
    } else if (edgeSoftness > 0) {
      // Edge softening: partial transparency for near-green pixels
      const greenDominance = g / Math.max(r, b, 1)
      if (greenDominance > 1.0 && g > greenThreshold * 0.7) {
        const alpha = Math.max(0, 255 - Math.floor((greenDominance - 1.0) * 255 * edgeSoftness))
        data[i + 3] = Math.min(data[i + 3] ?? 255, alpha)
        // Despill: reduce green tint on edge pixels
        data[i + 1] = Math.min(g, Math.max(r, b))
      }
    }
  }
}

/**
 * Starts a real-time chroma key processing loop on a video element.
 * Draws the result onto the provided canvas with green removed.
 * Returns a cleanup function to stop the loop.
 */
export function startChromaKeyLoop(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  options?: ChromaKeyOptions
): () => void {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    console.warn('[ChromaKey] Could not get canvas 2d context')
    return () => {}
  }

  let animFrameId = 0
  let running = true

  const draw = () => {
    if (!running) return
    if (video.readyState >= 2) {
      // Sync canvas size with video
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height)
      processFrame(frame, opts)
      ctx.putImageData(frame, 0, 0)
    }
    animFrameId = requestAnimationFrame(draw)
  }

  draw()

  return () => {
    running = false
    cancelAnimationFrame(animFrameId)
  }
}

/**
 * Processes a single image (HTMLImageElement) through chroma key.
 * Returns a new canvas element with transparency applied.
 */
export function processImageChromaKey(
  img: HTMLImageElement,
  options?: ChromaKeyOptions
): HTMLCanvasElement {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0)
  const frame = ctx.getImageData(0, 0, canvas.width, canvas.height)
  processFrame(frame, opts)
  ctx.putImageData(frame, 0, 0)
  return canvas
}
