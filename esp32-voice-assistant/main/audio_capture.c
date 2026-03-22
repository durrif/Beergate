/**
 * @file audio_capture.c  
 * @brief REAL audio capture using ESP32-S3-BOX-3 BSP microphone (ES7210)
 * 
 * Features:
 * - Continuous PCM16 16kHz mono capture from BSP codec
 * - RMS dB calculation for VU meter (always active)
 * - VAD (Voice Activity Detection) by threshold
 * - 5-second recording buffer (only stores when recording flag is set)
 */

#include "audio_capture.h"
#include "esp_log.h"
#include "esp_timer.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "bsp/esp-box-3.h"
#include "esp_codec_dev.h"
#include <string.h>
#include <stdlib.h>
#include <math.h>

static const char *TAG = "AUDIO";

// Pre-buffer: captures audio BEFORE speech onset so wake word isn't clipped
#define PRE_BUFFER_SECONDS  1
#define PRE_BUFFER_SAMPLES  (AUDIO_SAMPLE_RATE * PRE_BUFFER_SECONDS)  // 16000 samples = 32KB

// Audio state
typedef struct {
    bool initialized;
    bool capturing;      // mic task is running (always after init)
    bool recording;      // whether to buffer audio data
    bool paused;         // mic codec closed for speaker playback
    TaskHandle_t task_handle;
    
    // BSP codec
    esp_codec_dev_handle_t mic_dev;
    
    // Buffer (5 seconds max)
    int16_t *buffer;
    size_t buffer_capacity;    // Total capacity in samples
    size_t buffer_index;       // Current write position
    
    // Circular pre-buffer (always capturing, even when not recording)
    int16_t *pre_buffer;
    size_t pre_buf_capacity;   // PRE_BUFFER_SAMPLES
    size_t pre_buf_head;       // next write position
    size_t pre_buf_count;      // valid samples in buffer
    
    // Real-time metrics
    float current_rms_db;
    float vu_level;            // 0.0 to 1.0
    
    // VAD
    bool voice_detected;
    int64_t voice_start_time_ms;
    int64_t last_voice_time_ms;
} audio_state_t;

static audio_state_t s_state = {0};

/**
 * @brief Calculate RMS from PCM16 samples and convert to dB
 */
static float calculate_rms_db(const int16_t *samples, size_t count) {
    if (count == 0) return -60.0f;
    
    float sum_squares = 0.0f;
    for (size_t i = 0; i < count; i++) {
        float normalized = (float)samples[i] / 32768.0f;
        sum_squares += normalized * normalized;
    }
    
    float rms = sqrtf(sum_squares / (float)count);
    
    // Avoid log(0)
    if (rms < 0.00001f) return -60.0f;
    
    float db = 20.0f * log10f(rms);
    return fmaxf(db, -60.0f);  // Floor at -60dB
}

/**
 * @brief Audio capture task - runs CONTINUOUSLY after init
 * 
 * Always reads mic and calculates RMS/VU.
 * Only buffers audio when s_state.recording is true.
 */
static void audio_task(void *arg) {
    ESP_LOGI(TAG, "[TASK] Continuous audio monitoring started");
    
    const size_t frame_samples = (AUDIO_SAMPLE_RATE * AUDIO_FRAME_SIZE_MS) / 1000;  // 800 samples @ 50ms
    const size_t frame_bytes = frame_samples * sizeof(int16_t);
    
    int16_t *frame_buf = (int16_t *)malloc(frame_bytes);
    if (!frame_buf) {
        ESP_LOGE(TAG, "[TASK] Failed to allocate frame buffer");
        s_state.task_handle = NULL;
        vTaskDelete(NULL);
        return;
    }
    
    while (s_state.capturing) {
        // Skip reading while mic is paused (speaker is playing)
        if (s_state.paused) {
            vTaskDelay(pdMS_TO_TICKS(50));
            continue;
        }
        // Read from BSP codec (blocking call)
        // esp_codec_dev_read returns esp_err_t (0=ESP_OK), NOT byte count
        esp_err_t read_err = esp_codec_dev_read(s_state.mic_dev, frame_buf, frame_bytes);
        
        if (read_err != ESP_OK) {
            ESP_LOGE(TAG, "[TASK] Codec read error: %d", read_err);
            vTaskDelay(pdMS_TO_TICKS(50));
            continue;
        }
        
        // On success, we got exactly frame_samples samples
        size_t samples_read = frame_samples;
        
        // Always calculate RMS -> dB (even when not recording)
        s_state.current_rms_db = calculate_rms_db(frame_buf, samples_read);
        
        // Always update VU level (map -60dB..0dB -> 0.0..1.0)
        s_state.vu_level = (s_state.current_rms_db + 60.0f) / 60.0f;
        if (s_state.vu_level < 0.0f) s_state.vu_level = 0.0f;
        if (s_state.vu_level > 1.0f) s_state.vu_level = 1.0f;
        
        // VAD: always runs
        int64_t now_ms = esp_timer_get_time() / 1000;
        
        if (s_state.current_rms_db > VAD_DB_THRESHOLD) {
            if (!s_state.voice_detected) {
                s_state.voice_detected = true;
                s_state.voice_start_time_ms = now_ms;
            }
            s_state.last_voice_time_ms = now_ms;
        }
        
        if (s_state.recording) {
            // Buffer audio into recording buffer
            size_t space_left = s_state.buffer_capacity - s_state.buffer_index;
            size_t to_copy = (samples_read < space_left) ? samples_read : space_left;
            
            if (to_copy > 0) {
                memcpy(&s_state.buffer[s_state.buffer_index], frame_buf, to_copy * sizeof(int16_t));
                s_state.buffer_index += to_copy;
            }
            
            if (s_state.buffer_index >= s_state.buffer_capacity) {
                ESP_LOGW(TAG, "[TASK] Recording buffer FULL (%zu samples)", s_state.buffer_index);
                s_state.recording = false;
            }
        } else {
            // Not recording: write to circular pre-buffer so we capture speech before onset
            for (size_t i = 0; i < samples_read; i++) {
                s_state.pre_buffer[s_state.pre_buf_head] = frame_buf[i];
                s_state.pre_buf_head = (s_state.pre_buf_head + 1) % s_state.pre_buf_capacity;
            }
            if (s_state.pre_buf_count + samples_read >= s_state.pre_buf_capacity) {
                s_state.pre_buf_count = s_state.pre_buf_capacity;
            } else {
                s_state.pre_buf_count += samples_read;
            }
        }
    }
    
    free(frame_buf);
    s_state.task_handle = NULL;
    vTaskDelete(NULL);
}

/* ==================== PUBLIC API ==================== */

esp_err_t audio_capture_init(void) {
    if (s_state.initialized) {
        ESP_LOGW(TAG, "Already initialized");
        return ESP_OK;
    }
    
    ESP_LOGI(TAG, "Initializing continuous audio capture...");
    
    // Allocate buffer (5 seconds at 16kHz — PSRAM handles the 160KB easily)
    s_state.buffer_capacity = AUDIO_SAMPLE_RATE * 5;
    s_state.buffer = (int16_t *)malloc(s_state.buffer_capacity * sizeof(int16_t));
    if (!s_state.buffer) {
        ESP_LOGE(TAG, "Failed to allocate audio buffer (%zu bytes)", 
                 s_state.buffer_capacity * sizeof(int16_t));
        return ESP_ERR_NO_MEM;
    }
    
    // Allocate circular pre-buffer (1 second, captures audio before speech onset)
    s_state.pre_buf_capacity = PRE_BUFFER_SAMPLES;
    s_state.pre_buffer = (int16_t *)malloc(s_state.pre_buf_capacity * sizeof(int16_t));
    if (!s_state.pre_buffer) {
        ESP_LOGE(TAG, "Failed to allocate pre-buffer (%zu bytes)",
                 s_state.pre_buf_capacity * sizeof(int16_t));
        free(s_state.buffer);
        return ESP_ERR_NO_MEM;
    }
    s_state.pre_buf_head = 0;
    s_state.pre_buf_count = 0;
    
    // Initialize BSP I2C (required for codec configuration)
    esp_err_t ret = bsp_i2c_init();
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "[BSP] I2C init failed: %s", esp_err_to_name(ret));
        free(s_state.buffer);
        return ret;
    }
    
    // Initialize BSP audio (I2S + codec drivers)
    ret = bsp_audio_init(NULL);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "[BSP] Audio init failed: %s", esp_err_to_name(ret));
        free(s_state.buffer);
        return ret;
    }
    
    // Initialize microphone codec (ES7210 ADC)
    s_state.mic_dev = bsp_audio_codec_microphone_init();
    if (!s_state.mic_dev) {
        ESP_LOGE(TAG, "[BSP] Microphone codec init failed");
        free(s_state.buffer);
        return ESP_FAIL;
    }
    
    // Open codec with desired sample rate
    esp_codec_dev_sample_info_t fs = {
        .sample_rate = AUDIO_SAMPLE_RATE,
        .channel = 1,
        .bits_per_sample = 16
    };
    
    ret = esp_codec_dev_open(s_state.mic_dev, &fs);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "[CODEC] Open failed: %s", esp_err_to_name(ret));
        free(s_state.buffer);
        return ret;
    }
    
    // Set input gain
    esp_codec_dev_set_in_gain(s_state.mic_dev, 30.0f);
    
    s_state.buffer_index = 0;
    s_state.recording = false;
    s_state.current_rms_db = -60.0f;
    s_state.vu_level = 0.0f;
    s_state.voice_detected = false;
    s_state.initialized = true;
    
    // Start continuous audio monitoring task immediately
    s_state.capturing = true;
    BaseType_t task_ret = xTaskCreate(audio_task, "audio_cap", 4096, NULL, 5, &s_state.task_handle);
    if (task_ret != pdPASS) {
        ESP_LOGE(TAG, "Failed to create audio task");
        s_state.capturing = false;
        free(s_state.buffer);
        return ESP_FAIL;
    }
    
    ESP_LOGI(TAG, "Continuous audio capture initialized");
    ESP_LOGI(TAG, "  Rate: %d Hz, PCM16 mono, Gain: 30dB", AUDIO_SAMPLE_RATE);
    ESP_LOGI(TAG, "  VAD threshold: %.1f dB", VAD_DB_THRESHOLD);
    ESP_LOGI(TAG, "  Buffer: %zu samples (%.1fs)", s_state.buffer_capacity,
             (float)s_state.buffer_capacity / AUDIO_SAMPLE_RATE);
    
    return ESP_OK;
}

esp_err_t audio_capture_start(void) {
    if (!s_state.initialized) {
        ESP_LOGE(TAG, "Not initialized");
        return ESP_FAIL;
    }
    
    // Flush pre-buffer into recording buffer so we don't lose the wake word
    s_state.buffer_index = 0;
    if (s_state.pre_buf_count > 0) {
        size_t count = s_state.pre_buf_count;
        if (count > s_state.buffer_capacity) count = s_state.buffer_capacity;
        // Read from oldest sample in the circular buffer
        size_t start = (s_state.pre_buf_head + s_state.pre_buf_capacity - count) % s_state.pre_buf_capacity;
        for (size_t i = 0; i < count; i++) {
            s_state.buffer[i] = s_state.pre_buffer[(start + i) % s_state.pre_buf_capacity];
        }
        s_state.buffer_index = count;
        ESP_LOGI(TAG, "Pre-buffer: copied %zu samples (%.2fs)", count, (float)count / AUDIO_SAMPLE_RATE);
    }
    // Reset pre-buffer and VAD state
    s_state.pre_buf_count = 0;
    s_state.pre_buf_head = 0;
    s_state.voice_detected = false;
    s_state.voice_start_time_ms = 0;
    s_state.last_voice_time_ms = 0;
    s_state.recording = true;
    
    ESP_LOGI(TAG, "Recording started (buffering audio)");
    return ESP_OK;
}

esp_err_t audio_capture_stop(uint32_t *duration_ms, bool *has_voice, 
                               int16_t **audio_data, size_t *audio_size) {
    if (!s_state.recording) {
        ESP_LOGW(TAG, "Not recording");
        // Still return whatever is in the buffer
    }
    
    // Stop buffering (task keeps running for monitoring)
    s_state.recording = false;
    
    // Small delay to let the audio task finish current frame
    vTaskDelay(pdMS_TO_TICKS(60));
    
    // Calculate duration
    if (duration_ms) {
        *duration_ms = (s_state.buffer_index * 1000) / AUDIO_SAMPLE_RATE;
    }
    
    // Check voice activity
    if (has_voice) {
        *has_voice = s_state.voice_detected;
    }
    
    // Return pointer to internal buffer (valid until next audio_capture_start)
    // No copy needed — saves 64KB of RAM
    if (audio_data && audio_size) {
        *audio_data = s_state.buffer;
        *audio_size = s_state.buffer_index * sizeof(int16_t);
    }
    
    ESP_LOGI(TAG, "Recording stopped: %.2fs, %zu samples, voice=%s",
             (float)s_state.buffer_index / AUDIO_SAMPLE_RATE,
             s_state.buffer_index,
             s_state.voice_detected ? "YES" : "NO");
    
    return ESP_OK;
}

esp_err_t audio_capture_pause(void) {
    if (!s_state.initialized || s_state.paused) return ESP_OK;
    s_state.paused = true;
    vTaskDelay(pdMS_TO_TICKS(60));  // let audio task exit read loop
    esp_codec_dev_close(s_state.mic_dev);
    ESP_LOGI(TAG, "Mic paused (codec closed for speaker)");
    return ESP_OK;
}

esp_err_t audio_capture_resume(void) {
    if (!s_state.initialized || !s_state.paused) return ESP_OK;
    esp_codec_dev_sample_info_t fs = {
        .sample_rate = AUDIO_SAMPLE_RATE,
        .channel = 1,
        .bits_per_sample = 16
    };
    esp_err_t ret = esp_codec_dev_open(s_state.mic_dev, &fs);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Mic resume failed: %s", esp_err_to_name(ret));
        return ret;
    }
    s_state.paused = false;
    ESP_LOGI(TAG, "Mic resumed");
    return ESP_OK;
}

float audio_capture_get_rms_db(void) {
    return s_state.current_rms_db;
}

float audio_capture_get_vu_level(void) {
    return s_state.vu_level;
}
