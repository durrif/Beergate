/**
 * @file audio_capture.h
 * @brief Audio capture with PCM16 16kHz mono, RMS calculation, and VAD
 */

#ifndef AUDIO_CAPTURE_H
#define AUDIO_CAPTURE_H

#include "esp_err.h"
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

#define AUDIO_SAMPLE_RATE 16000
#define AUDIO_CHANNELS 1
#define AUDIO_BITS 16
#define AUDIO_FRAME_MS 50  // Process every 50ms
#define AUDIO_FRAME_SAMPLES (AUDIO_SAMPLE_RATE * AUDIO_FRAME_MS / 1000)
#define AUDIO_BUFFER_SIZE (AUDIO_FRAME_SAMPLES * 2)  // 16-bit = 2 bytes

// VAD thresholds
#define VAD_DB_THRESHOLD -35.0f  // dB threshold for voice activity
#define VAD_MIN_DURATION_MS 200  // Minimum voice duration

typedef struct {
    bool is_capturing;
    int64_t start_time_ms;
    uint32_t total_samples;
    float current_rms_db;
    bool has_voice_activity;
    int16_t *buffer;
    size_t buffer_size;
    size_t buffer_pos;
} audio_capture_state_t;

/**
 * @brief Initialize audio capture system
 * @return ESP_OK on success
 */
esp_err_t audio_capture_init(void);

/**
 * @brief Start audio capture
 * @return ESP_OK on success
 */
esp_err_t audio_capture_start(void);

/**
 * @brief Stop audio capture and get results
 * @param[out] duration_ms Capture duration in milliseconds
 * @param[out] has_voice True if voice activity detected
 * @param[out] audio_data Pointer to captured audio buffer (do not free)
 * @param[out] audio_size Size of audio data in bytes
 * @return ESP_OK on success
 */
esp_err_t audio_capture_stop(uint32_t *duration_ms, bool *has_voice, 
                              int16_t **audio_data, size_t *audio_size);

/**
 * @brief Get current RMS level in dB
 * @return RMS level in dB (-96.0 to 0.0)
 */
float audio_capture_get_rms_db(void);

/**
 * @brief Get current VU meter level (0.0 - 1.0)
 * @return Normalized level for VU display
 */
float audio_capture_get_vu_level(void);

/**
 * @brief Check if currently capturing
 * @return true if capturing
 */
bool audio_capture_is_active(void);

#ifdef __cplusplus
}
#endif

#endif // AUDIO_CAPTURE_H
