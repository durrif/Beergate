/**
 * @file audio_capture.c
 * @brief Audio capture implementation with real BSP microphone
 */

#include "audio_capture.h"
#include "bsp/esp-box-3.h"
#include "esp_log.h"
#include "esp_timer.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include <math.h>
#include <string.h>

static const char *TAG = "AUDIO_CAPTURE";

static audio_capture_state_t s_state = {0};
static TaskHandle_t s_audio_task = NULL;
static bool s_task_running = false;

#define MAX_AUDIO_BUFFER_SIZE (AUDIO_SAMPLE_RATE * 10 * 2)  // 10 seconds max

/**
 * @brief Calculate RMS from PCM16 samples
 */
static float calculate_rms(const int16_t *samples, size_t count) {
    if (count == 0) return 0.0f;
    
    float sum = 0.0f;
    for (size_t i = 0; i < count; i++) {
        float sample = (float)samples[i] / 32768.0f;
        sum += sample * sample;
    }
    float rms = sqrtf(sum / count);
    
    // Convert to dB (20 * log10(rms))
    if (rms < 0.00001f) return -96.0f;  // Silence floor
    float db = 20.0f * log10f(rms);
    return fmaxf(db, -96.0f);
}

/**
 * @brief Audio capture task
 */
static void audio_capture_task(void *arg) {
    ESP_LOGI(TAG, "[AUDIO TASK] Iniciada");
    
    int16_t *frame_buffer = malloc(AUDIO_BUFFER_SIZE);
    if (!frame_buffer) {
        ESP_LOGE(TAG, "[AUDIO TASK] Error: no memory for frame buffer");
        s_task_running = false;
        vTaskDelete(NULL);
        return;
    }
    
    // TODO: Aquí debes inicializar el micrófono del BSP
    // Ejemplo con esp_codec_dev (si el BSP lo expone):
    // esp_codec_dev_handle_t codec = bsp_audio_codec_microphone_init();
    // esp_codec_dev_set_in_gain(codec, 30.0);
    // esp_codec_dev_open(codec);
    
    int64_t voice_start_time = 0;
    bool voice_active = false;
    
    while (s_task_running && s_state.is_capturing) {
        // TODO: Leer datos reales del micrófono
        // size_t bytes_read = 0;
        // esp_codec_dev_read(codec, frame_buffer, AUDIO_BUFFER_SIZE, &bytes_read, 100);
        
        // SIMULACIÓN: Generar ruido blanco para testing
        for (int i = 0; i < AUDIO_FRAME_SAMPLES; i++) {
            frame_buffer[i] = (rand() % 1000) - 500;  // Ruido bajo
        }
        
        // Calculate RMS
        s_state.current_rms_db = calculate_rms(frame_buffer, AUDIO_FRAME_SAMPLES);
        
        // VAD: Check if voice is active
        if (s_state.current_rms_db > VAD_DB_THRESHOLD) {
            if (!voice_active) {
                voice_active = true;
                voice_start_time = esp_timer_get_time() / 1000;
                ESP_LOGI(TAG, "[VAD] Voz detectada (%.1f dB)", s_state.current_rms_db);
            }
            
            // Check minimum duration
            int64_t voice_duration = (esp_timer_get_time() / 1000) - voice_start_time;
            if (voice_duration >= VAD_MIN_DURATION_MS) {
                s_state.has_voice_activity = true;
            }
        } else {
            voice_active = false;
        }
        
        // Store in buffer (if space available)
        if (s_state.buffer_pos + AUDIO_FRAME_SAMPLES < s_state.buffer_size) {
            memcpy(s_state.buffer + s_state.buffer_pos, frame_buffer, 
                   AUDIO_FRAME_SAMPLES * sizeof(int16_t));
            s_state.buffer_pos += AUDIO_FRAME_SAMPLES;
            s_state.total_samples += AUDIO_FRAME_SAMPLES;
        } else {
            ESP_LOGW(TAG, "[AUDIO TASK] Buffer lleno, descartando audio");
        }
        
        vTaskDelay(pdMS_TO_TICKS(AUDIO_FRAME_MS));
    }
    
    // TODO: Cerrar codec
    // esp_codec_dev_close(codec);
    
    free(frame_buffer);
    ESP_LOGI(TAG, "[AUDIO TASK] Finalizada");
    s_task_running = false;
    vTaskDelete(NULL);
}

esp_err_t audio_capture_init(void) {
    ESP_LOGI(TAG, "Inicializando sistema de captura de audio");
    
    // Allocate buffer
    s_state.buffer_size = MAX_AUDIO_BUFFER_SIZE / sizeof(int16_t);
    s_state.buffer = malloc(MAX_AUDIO_BUFFER_SIZE);
    if (!s_state.buffer) {
        ESP_LOGE(TAG, "Error: no se pudo asignar buffer de audio");
        return ESP_ERR_NO_MEM;
    }
    
    s_state.is_capturing = false;
    s_state.buffer_pos = 0;
    s_state.total_samples = 0;
    s_state.current_rms_db = -96.0f;
    s_state.has_voice_activity = false;
    
    ESP_LOGI(TAG, "✅ Sistema de audio inicializado (buffer: %d samples)", 
             s_state.buffer_size);
    return ESP_OK;
}

esp_err_t audio_capture_start(void) {
    if (s_state.is_capturing) {
        ESP_LOGW(TAG, "[AUDIO] Ya está capturando");
        return ESP_ERR_INVALID_STATE;
    }
    
    // Reset state
    s_state.is_capturing = true;
    s_state.start_time_ms = esp_timer_get_time() / 1000;
    s_state.buffer_pos = 0;
    s_state.total_samples = 0;
    s_state.current_rms_db = -96.0f;
    s_state.has_voice_activity = false;
    
    // Start capture task
    s_task_running = true;
    xTaskCreate(audio_capture_task, "audio_capture", 4096, NULL, 5, &s_audio_task);
    
    ESP_LOGI(TAG, "[AUDIO] Captura iniciada");
    return ESP_OK;
}

esp_err_t audio_capture_stop(uint32_t *duration_ms, bool *has_voice,
                              int16_t **audio_data, size_t *audio_size) {
    if (!s_state.is_capturing) {
        ESP_LOGW(TAG, "[AUDIO] No está capturando");
        return ESP_ERR_INVALID_STATE;
    }
    
    s_state.is_capturing = false;
    s_task_running = false;
    
    // Wait for task to finish (max 500ms)
    int wait_count = 0;
    while (s_audio_task != NULL && wait_count < 50) {
        vTaskDelay(pdMS_TO_TICKS(10));
        wait_count++;
    }
    
    s_audio_task = NULL;
    
    // Calculate duration
    int64_t end_time = esp_timer_get_time() / 1000;
    *duration_ms = (uint32_t)(end_time - s_state.start_time_ms);
    *has_voice = s_state.has_voice_activity;
    *audio_data = s_state.buffer;
    *audio_size = s_state.buffer_pos * sizeof(int16_t);
    
    ESP_LOGI(TAG, "[AUDIO] Captura detenida: %lu ms, %zu bytes, VAD=%s (%.1f dB)",
             *duration_ms, *audio_size, *has_voice ? "VOZ" : "SILENCIO",
             s_state.current_rms_db);
    
    return ESP_OK;
}

float audio_capture_get_rms_db(void) {
    return s_state.current_rms_db;
}

float audio_capture_get_vu_level(void) {
    // Map dB range (-96 to 0) to VU level (0.0 to 1.0)
    // -60 dB = 0.0, -10 dB = 1.0
    float db = s_state.current_rms_db;
    if (db < -60.0f) return 0.0f;
    if (db > -10.0f) return 1.0f;
    return (db + 60.0f) / 50.0f;  // Linear mapping
}

bool audio_capture_is_active(void) {
    return s_state.is_capturing;
}
