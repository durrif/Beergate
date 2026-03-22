/**
 * @file ha_client.h
 * @brief Cliente HTTP para Wyoming protocol (Home Assistant Voice)
 * 
 * Envía audio PCM16 al servidor Wyoming de Home Assistant para:
 * - Speech-to-Text (STT)
 * - Intent Recognition
 * - Text-to-Speech (TTS)
 * 
 * Protocolo Wyoming:
 * - POST /stt con audio PCM16 mono 16kHz
 * - Respuesta JSON con texto transcrito
 * - POST /tts con texto
 * - Respuesta WAV con audio sintetizado
 * 
 * Uso:
 *   ha_client_config_t cfg = {
 *       .server_url = "http://192.168.1.100:10300",
 *       .timeout_ms = 10000
 *   };
 *   
 *   ha_client_init(&cfg);
 *   
 *   // Enviar audio para STT
 *   char *text = NULL;
 *   if (ha_send_audio_stt(pcm_data, pcm_size, &text) == 0) {
 *       ESP_LOGI("HA", "Transcrito: %s", text);
 *       free(text);
 *   }
 */

#ifndef HA_CLIENT_H
#define HA_CLIENT_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>
#include "esp_err.h"

#ifdef __cplusplus
extern "C" {
#endif

/**
 * Configuración del cliente Wyoming
 */
typedef struct {
    const char *server_url;          ///< URL del servidor Wyoming (ej: http://192.168.1.100:10300)
    uint32_t timeout_ms;             ///< Timeout para requests HTTP (ms)
    uint32_t max_retries;            ///< Número máximo de reintentos
    uint32_t sample_rate;            ///< Sample rate del audio (Hz)
    uint8_t channels;                ///< Número de canales (1=mono, 2=stereo)
    uint8_t bits_per_sample;         ///< Bits por sample (16)
    bool debug_enabled;              ///< Habilitar logs detallados
} ha_client_config_t;

/**
 * Configuración por defecto
 */
#define HA_CLIENT_DEFAULT_CONFIG() {                \
    .server_url = "http://192.168.30.102:10300",    \
    .timeout_ms = 15000,                            \
    .max_retries = 2,                               \
    .sample_rate = 16000,                           \
    .channels = 1,                                  \
    .bits_per_sample = 16,                          \
    .debug_enabled = false                          \
}

/**
 * Resultado de operaciones del cliente
 */
typedef enum {
    HA_CLIENT_OK = 0,                ///< Operación exitosa
    HA_CLIENT_ERR_INIT = -1,         ///< Error de inicialización
    HA_CLIENT_ERR_NETWORK = -2,      ///< Error de red/conexión
    HA_CLIENT_ERR_TIMEOUT = -3,      ///< Timeout en request
    HA_CLIENT_ERR_SERVER = -4,       ///< Error del servidor (HTTP 5xx)
    HA_CLIENT_ERR_INVALID = -5,      ///< Respuesta inválida
    HA_CLIENT_ERR_MEMORY = -6        ///< Error de memoria
} ha_client_error_t;

/**
 * Estadísticas del cliente
 */
typedef struct {
    uint32_t requests_sent;          ///< Total de requests enviados
    uint32_t requests_ok;            ///< Requests exitosos
    uint32_t requests_failed;        ///< Requests fallidos
    uint32_t bytes_sent;             ///< Bytes de audio enviados
    uint32_t bytes_received;         ///< Bytes de respuesta recibidos
    uint32_t avg_latency_ms;         ///< Latencia promedio (ms)
    uint32_t last_error;             ///< Último código de error
} ha_client_stats_t;

/**
 * Inicializar cliente Wyoming
 * 
 * @param config Configuración del cliente (NULL = usar defaults)
 * @return ESP_OK si éxito, ESP_FAIL si error
 */
esp_err_t ha_client_init(const ha_client_config_t *config);

/**
 * Enviar audio para Speech-to-Text
 * 
 * @param pcm16_data Buffer con audio PCM16 mono 16kHz
 * @param data_size Tamaño del buffer en bytes
 * @param out_text [out] Puntero a string con texto transcrito (debe liberarse con free())
 * @return HA_CLIENT_OK si éxito, código de error si falla
 * 
 * IMPORTANTE: El caller debe liberar out_text con free() después de usarlo
 */
ha_client_error_t ha_send_audio_stt(const int16_t *pcm16_data, 
                                     size_t data_size, 
                                     char **out_text);

/**
 * Enviar texto para Text-to-Speech
 * 
 * @param text Texto a sintetizar
 * @param out_wav_data [out] Puntero a buffer con audio WAV (debe liberarse con free())
 * @param out_wav_size [out] Tamaño del buffer WAV en bytes
 * @return HA_CLIENT_OK si éxito, código de error si falla
 * 
 * IMPORTANTE: El caller debe liberar out_wav_data con free() después de usarlo
 */
ha_client_error_t ha_send_text_tts(const char *text,
                                    uint8_t **out_wav_data,
                                    size_t *out_wav_size);

/**
 * Obtener estadísticas del cliente
 * 
 * @param stats [out] Estructura con estadísticas
 */
void ha_client_get_stats(ha_client_stats_t *stats);

/**
 * Resetear estadísticas
 */
void ha_client_reset_stats(void);

/**
 * Obtener descripción legible del error
 * 
 * @param error Código de error
 * @return String con descripción del error
 */
const char* ha_client_error_to_string(ha_client_error_t error);

/**
 * Verificar si el cliente está inicializado
 * 
 * @return true si inicializado, false si no
 */
bool ha_client_is_initialized(void);

/**
 * De-inicializar cliente (libera recursos)
 */
void ha_client_deinit(void);

#ifdef __cplusplus
}
#endif

#endif /* HA_CLIENT_H */
