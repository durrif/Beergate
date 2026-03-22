#ifndef VAD_H
#define VAD_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

// Frame size: 20ms @ 16kHz = 320 samples
#define VAD_FRAME_SIZE_MS       20
#define VAD_SAMPLE_RATE         16000
#define VAD_FRAME_SIZE          ((VAD_SAMPLE_RATE * VAD_FRAME_SIZE_MS) / 1000)  // 320 samples

// Umbrales configurables
#define VAD_ENERGY_THRESHOLD    -40.0f   // dB (ajustar según ruido ambiente)
#define VAD_ZCR_THRESHOLD       0.3f     // Ratio de cruces por cero
#define VAD_SPEECH_FRAMES       3        // Frames consecutivos para confirmar habla
#define VAD_SILENCE_FRAMES      20       // Frames de silencio para confirmar fin (400ms)

typedef enum {
    VAD_SILENCE = 0,
    VAD_SPEECH = 1
} vad_state_t;

typedef struct {
    float energy_threshold_db;
    float zcr_threshold;
    int speech_frames_needed;
    int silence_frames_needed;
    
    // Estado interno
    vad_state_t current_state;
    int consecutive_speech_frames;
    int consecutive_silence_frames;
    
    // Estadísticas
    uint32_t total_frames;
    uint32_t speech_frames;
    uint32_t silence_frames;
} vad_context_t;

/**
 * Inicializa el contexto VAD con parámetros por defecto
 */
void vad_init(vad_context_t *ctx);

/**
 * Procesa un frame de audio PCM16
 * @param ctx Contexto VAD
 * @param samples Buffer con samples PCM16
 * @param n Número de samples (debe ser VAD_FRAME_SIZE)
 * @return VAD_SPEECH si hay voz, VAD_SILENCE si no
 */
vad_state_t vad_process_frame(vad_context_t *ctx, const int16_t *samples, size_t n);

/**
 * Reinicia el estado del VAD (útil tras detectar wake word)
 */
void vad_reset(vad_context_t *ctx);

/**
 * Obtiene estadísticas del VAD
 */
void vad_get_stats(vad_context_t *ctx, uint32_t *total, uint32_t *speech, uint32_t *silence);

#ifdef __cplusplus
}
#endif

#endif // VAD_H
