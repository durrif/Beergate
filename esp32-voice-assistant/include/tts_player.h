/**
 * @file tts_player.h
 * @brief Reproductor TTS con parser WAV y streaming desde Home Assistant
 * 
 * Características:
 * - Streaming HTTP: No carga todo el WAV en RAM
 * - Parser WAV: Soporta PCM 16-bit mono (16kHz ideal, pero adaptable)
 * - Control de volumen: Software gain con anti-clipping
 * - Reconfiguración dinámica I2S según sample rate del WAV
 * - Callback de progreso para UI (amplitud de audio para animación)
 * 
 * Flujo:
 * 1. tts_player_speak(text) -> POST /tts -> recibe WAV stream
 * 2. Parse header RIFF/WAVE -> extrae sample_rate, channels, bits
 * 3. Reconfigura I2S si necesario
 * 4. Lee y reproduce chunks del payload "data"
 * 5. Callback a UI con amplitud para animación boca
 */

#ifndef TTS_PLAYER_H
#define TTS_PLAYER_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>
#include "esp_err.h"

#ifdef __cplusplus
extern "C" {
#endif

/**
 * Estados del reproductor TTS
 */
typedef enum {
    TTS_STATE_IDLE = 0,
    TTS_STATE_CONNECTING,
    TTS_STATE_DOWNLOADING,
    TTS_STATE_PLAYING,
    TTS_STATE_ERROR
} tts_state_t;

/**
 * Callback para progreso de reproducción
 * 
 * @param amplitude Amplitud actual del audio (0-100) para animación
 * @param progress Progreso de reproducción (0.0 - 1.0)
 * @param user_data Datos de usuario
 */
typedef void (*tts_progress_callback_t)(uint8_t amplitude, float progress, void *user_data);

/**
 * Configuración del reproductor TTS
 */
typedef struct {
    uint8_t volume_percent;              ///< Volumen 0-100%
    bool auto_adjust_i2s;                ///< Reconfigurar I2S automáticamente según WAV
    uint32_t chunk_size;                 ///< Tamaño de chunk para streaming (bytes)
    tts_progress_callback_t callback;    ///< Callback de progreso (opcional)
    void *callback_user_data;            ///< Datos para callback
} tts_player_config_t;

/**
 * Configuración por defecto
 */
#define TTS_PLAYER_DEFAULT_CONFIG() {   \
    .volume_percent = 70,                \
    .auto_adjust_i2s = true,             \
    .chunk_size = 4096,                  \
    .callback = NULL,                    \
    .callback_user_data = NULL           \
}

/**
 * Información del WAV actual
 */
typedef struct {
    uint32_t sample_rate;
    uint16_t channels;
    uint16_t bits_per_sample;
    uint32_t data_size;
    uint32_t duration_ms;
} tts_wav_info_t;

/**
 * Inicializar reproductor TTS
 * 
 * @param config Configuración (NULL = defaults)
 * @return ESP_OK si éxito
 */
esp_err_t tts_player_init(const tts_player_config_t *config);

/**
 * Hablar texto usando TTS de Home Assistant
 * 
 * @param text Texto a sintetizar y reproducir
 * @return ESP_OK si éxito, ESP_FAIL si error
 * 
 * BLOQUEA hasta que termine la reproducción. Llamar desde task dedicada.
 */
esp_err_t tts_player_speak(const char *text);

/**
 * Hablar texto de forma asíncrona (no bloquea)
 * 
 * @param text Texto a sintetizar (se copia internamente)
 * @return ESP_OK si éxito
 */
esp_err_t tts_player_speak_async(const char *text);

/**
 * Detener reproducción actual
 */
void tts_player_stop(void);

/**
 * Obtener estado actual
 */
tts_state_t tts_player_get_state(void);

/**
 * Obtener información del WAV actual
 * 
 * @param info [out] Información del WAV
 * @return true si hay WAV actual, false si no
 */
bool tts_player_get_wav_info(tts_wav_info_t *info);

/**
 * Ajustar volumen
 * 
 * @param volume_percent 0-100%
 */
void tts_player_set_volume(uint8_t volume_percent);

/**
 * Obtener volumen actual
 */
uint8_t tts_player_get_volume(void);

/**
 * Verificar si está reproduciendo
 */
bool tts_player_is_playing(void);

#ifdef __cplusplus
}
#endif

#endif /* TTS_PLAYER_H */
