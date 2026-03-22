#ifndef AUDIO_HAL_H
#define AUDIO_HAL_H

#include "esp_err.h"
#include "driver/i2s_std.h"

#ifdef __cplusplus
extern "C" {
#endif

/**
 * Inicializa el hardware de audio (micrófonos + altavoz)
 * Configura:
 * - I2S para captura desde ES7210 (4 micrófonos)
 * - I2S para reproducción hacia ES8311 (altavoz)
 * - I2C para control de codecs
 * 
 * ERROR COMÚN: Olvidar habilitar PA_CTRL (GPIO46) → sin sonido
 */
esp_err_t audio_hal_init(void);

/**
 * Lee datos del micrófono (blocking)
 * @param buffer Buffer para almacenar muestras de audio
 * @param size Tamaño del buffer en bytes
 * @param bytes_read Número de bytes leídos (salida)
 * @param timeout_ms Timeout en milisegundos
 * 
 * IMPORTANTE: Para Wyoming/VAD usar 16kHz, mono, 16-bit
 */
esp_err_t audio_hal_read_microphone(void *buffer, size_t size, size_t *bytes_read, uint32_t timeout_ms);

/**
 * Escribe datos al altavoz (blocking)
 * @param buffer Buffer con datos de audio
 * @param size Tamaño en bytes
 * @param bytes_written Bytes escritos (salida)
 * @param timeout_ms Timeout en milisegundos
 */
esp_err_t audio_hal_write_speaker(const void *buffer, size_t size, size_t *bytes_written, uint32_t timeout_ms);

/**
 * Control de volumen del altavoz (0-100)
 */
esp_err_t audio_hal_set_volume(uint8_t volume);

/**
 * Mute/unmute del altavoz
 */
esp_err_t audio_hal_set_mute(bool mute);

/**
 * Libera recursos de audio
 */
esp_err_t audio_hal_deinit(void);

#ifdef __cplusplus
}
#endif

#endif // AUDIO_HAL_H
