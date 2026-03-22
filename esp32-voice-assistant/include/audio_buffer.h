#ifndef AUDIO_BUFFER_H
#define AUDIO_BUFFER_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/**
 * Buffer circular para audio PCM16
 * Útil para mantener pre-roll (audio previo al wake word)
 */
typedef struct {
    int16_t *buffer;
    size_t capacity;      // Tamaño total en samples
    size_t write_pos;     // Posición de escritura
    size_t read_pos;      // Posición de lectura
    size_t available;     // Samples disponibles para leer
    bool overrun;         // Flag de overrun
} audio_buffer_t;

/**
 * Crea un buffer circular
 * @param duration_ms Duración del buffer en milisegundos
 * @param sample_rate Sample rate (ej: 16000 Hz)
 * @return Puntero al buffer o NULL si falla
 */
audio_buffer_t* audio_buffer_create(uint32_t duration_ms, uint32_t sample_rate);

/**
 * Libera el buffer
 */
void audio_buffer_destroy(audio_buffer_t *buf);

/**
 * Escribe samples en el buffer (modo circular)
 * @return Número de samples escritos
 */
size_t audio_buffer_write(audio_buffer_t *buf, const int16_t *samples, size_t n);

/**
 * Lee samples del buffer
 * @return Número de samples leídos
 */
size_t audio_buffer_read(audio_buffer_t *buf, int16_t *samples, size_t n);

/**
 * Obtiene todos los samples disponibles (para enviar al servidor)
 * @param out_buffer Puntero que recibirá el buffer interno
 * @return Número de samples disponibles
 */
size_t audio_buffer_get_all(audio_buffer_t *buf, int16_t **out_buffer);

/**
 * Reinicia el buffer
 */
void audio_buffer_reset(audio_buffer_t *buf);

/**
 * Obtiene el número de samples disponibles
 */
size_t audio_buffer_available(audio_buffer_t *buf);

/**
 * Verifica si hubo overrun
 */
bool audio_buffer_has_overrun(audio_buffer_t *buf);

#ifdef __cplusplus
}
#endif

#endif // AUDIO_BUFFER_H
