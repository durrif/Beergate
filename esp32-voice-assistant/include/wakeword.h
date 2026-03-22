/**
 * @file wakeword.h
 * @brief Wake word detection module para "Hey Jarvis"
 * 
 * Detecta la palabra de activación en el flujo de audio PCM16.
 * 
 * Implementación actual: Placeholder basado en energía y duración para testing
 * Futuro: Reemplazar con ESP-SR (esp_afe_sr) para detección real
 * 
 * Uso:
 *   wakeword_context_t ctx;
 *   wakeword_init(&ctx, "hey_jarvis");
 *   
 *   while(capturing) {
 *       wakeword_result_t res = wakeword_feed_pcm16(&ctx, samples, count);
 *       if (res == WAKEWORD_DETECTED) {
 *           // Trigger listening state
 *       }
 *   }
 */

#ifndef WAKEWORD_H
#define WAKEWORD_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/**
 * Estados de detección del wake word
 */
typedef enum {
    WAKEWORD_NOT_DETECTED = 0,  ///< No se detectó wake word
    WAKEWORD_DETECTED = 1,       ///< Wake word detectado con confianza
    WAKEWORD_PARTIAL = 2         ///< Detección parcial (para debug)
} wakeword_result_t;

/**
 * Configuración del detector
 */
typedef struct {
    const char *model_name;      ///< Nombre del modelo ("hey_jarvis", "alexa", etc.)
    float threshold;             ///< Umbral de confianza (0.0 - 1.0)
    uint32_t cooldown_ms;        ///< Tiempo mínimo entre detecciones (ms)
    bool debug_enabled;          ///< Habilitar logs de debug
} wakeword_config_t;

/**
 * Contexto del detector (opaco)
 */
typedef struct {
    wakeword_config_t config;
    
    // Estado interno para placeholder
    uint32_t consecutive_speech_frames;
    uint32_t last_detection_time;
    float accumulated_energy;
    bool in_potential_wakeword;
    
    // Estadísticas
    uint32_t total_detections;
    uint32_t false_positives;
    
    // Futuro: puntero a contexto ESP-SR
    void *esp_sr_handle;
} wakeword_context_t;

/**
 * Configuración por defecto
 */
#define WAKEWORD_DEFAULT_CONFIG() {         \
    .model_name = "hey_jarvis",             \
    .threshold = 0.7f,                      \
    .cooldown_ms = 2000,                    \
    .debug_enabled = false                  \
}

/**
 * Inicializar detector de wake word
 * 
 * @param ctx Contexto a inicializar
 * @param config Configuración (NULL = usar defaults)
 * @return 0 si OK, -1 si error
 */
int wakeword_init(wakeword_context_t *ctx, const wakeword_config_t *config);

/**
 * Alimentar audio PCM16 al detector
 * 
 * @param ctx Contexto del detector
 * @param pcm16 Buffer de audio (mono, 16kHz, 16-bit signed)
 * @param sample_count Número de samples en el buffer
 * @return WAKEWORD_DETECTED, WAKEWORD_NOT_DETECTED o WAKEWORD_PARTIAL
 * 
 * IMPORTANTE: Esta función debe ser llamada con frames regulares (ej: 20ms)
 */
wakeword_result_t wakeword_feed_pcm16(wakeword_context_t *ctx, 
                                       const int16_t *pcm16, 
                                       size_t sample_count);

/**
 * Reset del detector (limpia estado interno)
 * 
 * @param ctx Contexto del detector
 */
void wakeword_reset(wakeword_context_t *ctx);

/**
 * Obtener estadísticas del detector
 * 
 * @param ctx Contexto
 * @param total_detections [out] Total de detecciones
 * @param false_positives [out] Estimación de falsos positivos
 */
void wakeword_get_stats(const wakeword_context_t *ctx, 
                        uint32_t *total_detections,
                        uint32_t *false_positives);

/**
 * Obtener nombre del modelo activo
 * 
 * @param ctx Contexto
 * @return String con nombre del modelo
 */
const char* wakeword_get_model_name(const wakeword_context_t *ctx);

/**
 * Verificar si ESP-SR está disponible
 * 
 * @return true si se compiló con soporte ESP-SR
 */
bool wakeword_has_esp_sr_support(void);

#ifdef __cplusplus
}
#endif

#endif /* WAKEWORD_H */
