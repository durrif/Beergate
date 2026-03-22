/**
 * @file audio_capture.h
 * @brief REAL audio capture API for ESP32-S3-BOX-3
 */

#ifndef AUDIO_CAPTURE_H
#define AUDIO_CAPTURE_H

#include "esp_err.h"
#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

// Audio configuration
#define AUDIO_SAMPLE_RATE        16000    // Hz (Wyoming STT compatible)
#define AUDIO_FRAME_SIZE_MS      50       // ms per frame
#define AUDIO_BUFFER_SIZE        (AUDIO_SAMPLE_RATE * AUDIO_FRAME_SIZE_MS / 1000 * 2)

// VAD (Voice Activity Detection) parameters
#define VAD_DB_THRESHOLD         -35.0f   // dB threshold for voice detection
#define VAD_MIN_DURATION_MS      200      // Minimum voice duration to be valid

/**
 * @brief Initialize audio capture system with BSP microphone
 */
esp_err_t audio_capture_init(void);

/**
 * @brief Start audio capture
 */
esp_err_t audio_capture_start(void);

/**
 * @brief Stop audio capture and retrieve captured data
 */
esp_err_t audio_capture_stop(uint32_t *duration_ms, bool *has_voice, 
                               int16_t **audio_data, size_t *audio_size);

/**
 * @brief Pause mic capture (close codec). Call before speaker playback.
 */
esp_err_t audio_capture_pause(void);

/**
 * @brief Resume mic capture (reopen codec). Call after speaker playback.
 */
esp_err_t audio_capture_resume(void);

/**
 * @brief Get current RMS level in dB
 */
float audio_capture_get_rms_db(void);

/**
 * @brief Get current VU meter level (normalized 0.0 to 1.0)
 */
float audio_capture_get_vu_level(void);

#ifdef __cplusplus
}
#endif

#endif // AUDIO_CAPTURE_H
