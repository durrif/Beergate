/**
 * @file wyoming_client.h
 * @brief Voice Gateway client - sends audio, receives STT text + TTS audio
 */

#ifndef WYOMING_CLIENT_H
#define WYOMING_CLIENT_H

#include "esp_err.h"
#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Voice Gateway on CT 103 */
#define GATEWAY_HOST     "192.168.30.102"
#define GATEWAY_PORT     8000
#define GATEWAY_TIMEOUT_MS 30000

/**
 * @brief Initialize the speaker codec for TTS playback
 */
esp_err_t voice_gateway_init_speaker(void);

/**
 * @brief Send audio to Voice Gateway (/api/voice/process)
 *        Returns transcription text AND plays TTS response through speaker
 *
 * @param audio_data  PCM16 audio (16kHz mono 16-bit)
 * @param audio_size  Size in bytes
 * @param[out] text_out  Transcription text (caller must free)
 * @param[out] text_len  Length of transcription
 * @return ESP_OK on success
 */
esp_err_t wyoming_stt_send(const int16_t *audio_data, size_t audio_size,
                           char **text_out, size_t *text_len,
                           bool skip_trigger);

/**
 * @brief Check Voice Gateway health
 * @return ESP_OK if gateway is healthy
 */
esp_err_t voice_gateway_health_check(void);

#ifdef __cplusplus
}
#endif

#endif // WYOMING_CLIENT_H
