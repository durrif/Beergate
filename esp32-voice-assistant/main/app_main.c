/**
 * @file app_main.c
 * @brief ESP32-S3-BOX-3 Voice Assistant — Hands-free with server-side wake word
 * 
 * Features:
 * - Continuous mic monitoring with VAD
 * - Auto-records on speech detection, auto-stops on silence
 * - Server-side wake word: gateway checks for trigger phrase "cervecero"
 * - Button still works as manual override (hold to record, release to send)
 * - LVGL animated UI with cat sprite and VU meter
 */

#include <stdio.h>
#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_log.h"
#include "nvs_flash.h"
#include "esp_event.h"
#include "esp_netif.h"
#include "esp_wifi.h"
#include "bsp/esp-box-3.h"
#include "iot_button.h"
#include "ui.h"
#include "audio_capture.h"
#include "wyoming_client.h"

static const char *TAG = "VOICE_ASSISTANT";

/* ==================== STATE MACHINE ==================== */

typedef enum {
    VOICE_IDLE,         // Monitoring mic, waiting for speech
    VOICE_RECORDING,    // Recording speech, waiting for silence
    VOICE_PROCESSING,   // Sending to gateway, waiting for response
    VOICE_COOLDOWN      // Brief pause after response (avoid self-trigger)
} voice_state_t;

static volatile voice_state_t voice_state = VOICE_IDLE;
static volatile bool is_recording = false;
static volatile bool is_processing = false;
static volatile bool button_recording = false; // true when button controls recording

/* ==================== STT PROCESSING ==================== */

/**
 * @brief Task for processing STT (runs after recording stops)
 * arg: (bool*) skip_trigger flag — true for button mode
 */
static void stt_processing_task(void *arg) {
    bool skip_trigger = (arg != NULL);
    ESP_LOGI(TAG, "[STT] Starting processing... (skip_trigger=%d)", skip_trigger);
    
    // Transition to THINKING state
    ui_set_state(UI_STATE_THINKING, NULL);
    
    // Stop audio capture and get data
    uint32_t duration_ms = 0;
    bool has_voice = false;
    int16_t *audio_data = NULL;
    size_t audio_size = 0;
    
    esp_err_t ret = audio_capture_stop(&duration_ms, &has_voice, &audio_data, &audio_size);
    
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "[STT] Error stopping audio capture");
        goto cleanup;
    }
    
    ESP_LOGI(TAG, "[STT] Audio: duration=%lu ms, voice=%d, size=%zu bytes",
             duration_ms, has_voice, audio_size);
    
    // Check minimum duration
    if (duration_ms < 300) {
        ESP_LOGW(TAG, "[STT] Audio too short (<300ms), discarding");
        goto cleanup;
    }
    
    // Send to Voice Gateway
    ESP_LOGI(TAG, "[STT] Sending %zu bytes to gateway...", audio_size);
    
    char *transcription = NULL;
    size_t transcription_len = 0;
    
    ret = wyoming_stt_send(audio_data, audio_size, &transcription, &transcription_len, skip_trigger);
    
    // audio_data points to internal buffer — do NOT free it
    
    if (ret == ESP_ERR_NOT_FOUND) {
        // Gateway returned 204: no trigger phrase detected
        ESP_LOGI(TAG, "[STT] No trigger phrase — ignoring");
        goto cleanup;
    }
    
    if (ret != ESP_OK || transcription == NULL || transcription_len == 0) {
        ESP_LOGE(TAG, "[STT] Gateway error");
        ui_set_state(UI_STATE_IDLE, "Error");
        vTaskDelay(pdMS_TO_TICKS(1500));
        goto cleanup;
    }
    
    ESP_LOGI(TAG, "[STT] Response: \"%s\"", transcription);
    
    // TTS was already played by wyoming_stt_send()
    ui_set_state(UI_STATE_SPEAKING, transcription);
    vTaskDelay(pdMS_TO_TICKS(2000));
    
    free(transcription);

cleanup:
    is_processing = false;
    is_recording = false;
    button_recording = false;
    ui_set_state(UI_STATE_IDLE, NULL);
    ESP_LOGI(TAG, "[STT] Processing complete");
    vTaskDelete(NULL);
}

/* ==================== BUTTON CALLBACKS (manual override) ==================== */

static void button_press_down_cb(void *arg, void *data) {
    if (is_recording || is_processing) {
        ESP_LOGW(TAG, "[BTN] Busy, ignoring");
        return;
    }
    
    ESP_LOGI(TAG, "[BTN] PRESSED -> manual recording");
    
    button_recording = true;
    is_recording = true;
    voice_state = VOICE_RECORDING;
    
    ui_set_state(UI_STATE_LISTENING, NULL);
    audio_capture_start();
}

static void button_press_up_cb(void *arg, void *data) {
    if (!button_recording) {
        return;
    }
    
    ESP_LOGI(TAG, "[BTN] RELEASED -> stop and process");
    
    button_recording = false;
    is_recording = false;
    is_processing = true;
    voice_state = VOICE_PROCESSING;
    
    xTaskCreate(stt_processing_task, "stt_task", 8192, (void*)1, 5, NULL);
}

/* ==================== CONTINUOUS LISTENING TASK ==================== */

// Tuning parameters
#define SPEECH_THRESHOLD_DB   -30.0f   // dB above this = speech detected
#define SILENCE_THRESHOLD_DB  -35.0f   // dB below this = silence
#define SPEECH_ONSET_FRAMES   6        // 300ms of speech to start recording (6 * 50ms)
#define SILENCE_END_FRAMES    60       // 3s of silence to stop recording (60 * 50ms)
#define COOLDOWN_MS           3000     // 3s cooldown after response

/**
 * @brief Continuous listening task — auto-detects speech and triggers recording
 */
static void voice_pipeline_task(void *arg) {
    ESP_LOGI(TAG, "[VOICE] Continuous listening active");
    ESP_LOGI(TAG, "[VOICE] Say 'cervecero' + your question");
    
    int speech_frames = 0;
    int silence_frames = 0;
    
    while (1) {
        vTaskDelay(pdMS_TO_TICKS(50));  // 20Hz polling
        
        float rms_db = audio_capture_get_rms_db();
        float vu = audio_capture_get_vu_level();
        
        switch (voice_state) {
        case VOICE_IDLE:
            // Show subtle VU even in idle (shows mic is active)
            if (vu > 0.15f) {
                ui_set_vu_level(vu * 0.3f);  // Dimmed VU in idle
            } else {
                ui_set_vu_level(0.0f);
            }
            
            // Skip if button is controlling or already processing
            if (button_recording || is_processing) break;
            
            // Detect speech onset
            if (rms_db > SPEECH_THRESHOLD_DB) {
                speech_frames++;
                if (speech_frames >= SPEECH_ONSET_FRAMES) {
                    ESP_LOGI(TAG, "[VOICE] Speech detected! Auto-recording...");
                    voice_state = VOICE_RECORDING;
                    is_recording = true;
                    audio_capture_start();
                    ui_set_state(UI_STATE_LISTENING, NULL);
                    speech_frames = 0;
                    silence_frames = 0;
                }
            } else {
                speech_frames = 0;
            }
            break;
            
        case VOICE_RECORDING:
            // Full VU during recording
            ui_set_vu_level(vu);
            
            // Skip auto-stop if button is controlling
            if (button_recording) break;
            
            // Detect sustained silence (end of speech)
            if (rms_db <= SILENCE_THRESHOLD_DB) {
                silence_frames++;
                if (silence_frames >= SILENCE_END_FRAMES) {
                    ESP_LOGI(TAG, "[VOICE] Silence detected. Processing...");
                    voice_state = VOICE_PROCESSING;
                    is_recording = false;
                    is_processing = true;
                    silence_frames = 0;
                    xTaskCreate(stt_processing_task, "stt_task", 8192, NULL, 5, NULL);
                }
            } else {
                silence_frames = 0;
            }
            break;
            
        case VOICE_PROCESSING:
            ui_set_vu_level(0.0f);
            // Wait for stt_processing_task to finish
            if (!is_processing) {
                voice_state = VOICE_COOLDOWN;
            }
            break;
            
        case VOICE_COOLDOWN:
            ui_set_vu_level(0.0f);
            // Wait to avoid self-triggering on TTS playback echo
            vTaskDelay(pdMS_TO_TICKS(COOLDOWN_MS));
            voice_state = VOICE_IDLE;
            speech_frames = 0;
            silence_frames = 0;
            ESP_LOGI(TAG, "[VOICE] Ready — listening for 'cervecero'...");
            break;
        }
    }
}

/* ==================== WIFI INITIALIZATION ==================== */

#define WIFI_CONNECTED_BIT BIT0
#define WIFI_FAIL_BIT      BIT1

static EventGroupHandle_t s_wifi_event_group;
static int s_retry_num = 0;

static void wifi_event_handler(void *arg, esp_event_base_t event_base,
                                int32_t event_id, void *event_data) {
    if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_START) {
        esp_wifi_connect();
    } else if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_DISCONNECTED) {
        if (s_retry_num < 10) {
            esp_wifi_connect();
            s_retry_num++;
            ESP_LOGI(TAG, "[WIFI] Retry (%d/10)", s_retry_num);
        } else {
            xEventGroupSetBits(s_wifi_event_group, WIFI_FAIL_BIT);
        }
    } else if (event_base == IP_EVENT && event_id == IP_EVENT_STA_GOT_IP) {
        ip_event_got_ip_t *event = (ip_event_got_ip_t *) event_data;
        ESP_LOGI(TAG, "[WIFI] Got IP: " IPSTR, IP2STR(&event->ip_info.ip));
        s_retry_num = 0;
        xEventGroupSetBits(s_wifi_event_group, WIFI_CONNECTED_BIT);
    }
}

static esp_err_t wifi_init(void) {
    s_wifi_event_group = xEventGroupCreate();
    
    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());
    esp_netif_create_default_wifi_sta();
    
    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));
    
    esp_event_handler_instance_t instance_any_id;
    esp_event_handler_instance_t instance_got_ip;
    ESP_ERROR_CHECK(esp_event_handler_instance_register(WIFI_EVENT,
                    ESP_EVENT_ANY_ID, &wifi_event_handler, NULL, &instance_any_id));
    ESP_ERROR_CHECK(esp_event_handler_instance_register(IP_EVENT,
                    IP_EVENT_STA_GOT_IP, &wifi_event_handler, NULL, &instance_got_ip));
    
    wifi_config_t wifi_config = {
        .sta = {
            .ssid = CONFIG_EXAMPLE_WIFI_SSID,
            .password = CONFIG_EXAMPLE_WIFI_PASSWORD,
            .threshold.authmode = WIFI_AUTH_WPA2_PSK,
        },
    };
    
    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));
    ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_STA, &wifi_config));
    ESP_ERROR_CHECK(esp_wifi_start());
    
    EventBits_t bits = xEventGroupWaitBits(s_wifi_event_group,
            WIFI_CONNECTED_BIT | WIFI_FAIL_BIT, pdFALSE, pdFALSE, portMAX_DELAY);
    
    if (bits & WIFI_CONNECTED_BIT) {
        ESP_LOGI(TAG, "WiFi connected to %s", CONFIG_EXAMPLE_WIFI_SSID);
        return ESP_OK;
    }
    ESP_LOGE(TAG, "WiFi connection FAILED");
    return ESP_FAIL;
}

/* ==================== MAIN ==================== */

void app_main(void) {
    ESP_LOGI(TAG, "=========================================");
    ESP_LOGI(TAG, " ESP32-S3-BOX-3 Voice Assistant");
    ESP_LOGI(TAG, " Wake word: 'cervecero'");
    ESP_LOGI(TAG, "=========================================");
    
    // 1. NVS
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);
    
    // 2. WiFi
    ESP_ERROR_CHECK(wifi_init());
    
    // 3. Display
    lv_display_t *disp = bsp_display_start();
    if (!disp) {
        ESP_LOGE(TAG, "Display init failed");
        return;
    }
    bsp_display_backlight_on();
    
    // 4. UI
    ESP_ERROR_CHECK(ui_init());
    
    // 5. Audio capture (starts continuous mic monitoring)
    ESP_ERROR_CHECK(audio_capture_init());
    
    // 6. Speaker
    ESP_ERROR_CHECK(voice_gateway_init_speaker());
    
    // 7. Gateway health check
    if (voice_gateway_health_check() == ESP_OK) {
        ESP_LOGI(TAG, "Voice Gateway OK");
    } else {
        ESP_LOGW(TAG, "Voice Gateway not reachable");
    }
    
    // 8. Buttons (manual override)
    button_handle_t btns[BSP_BUTTON_NUM];
    int btn_cnt = 0;
    ESP_ERROR_CHECK(bsp_iot_button_create(btns, &btn_cnt, BSP_BUTTON_NUM));
    
    if (btn_cnt > BSP_BUTTON_MAIN) {
        iot_button_register_cb(btns[BSP_BUTTON_MAIN], BUTTON_PRESS_DOWN, NULL, button_press_down_cb, NULL);
        iot_button_register_cb(btns[BSP_BUTTON_MAIN], BUTTON_PRESS_UP, NULL, button_press_up_cb, NULL);
    }
    
    // 9. Start continuous listening pipeline
    xTaskCreate(voice_pipeline_task, "voice_pipe", 4096, NULL, 4, NULL);
    
    // 10. Ready
    ESP_LOGI(TAG, "=========================================");
    ESP_LOGI(TAG, " System READY");
    ESP_LOGI(TAG, " Say 'cervecero' + your question");
    ESP_LOGI(TAG, " Or hold button to record manually");
    ESP_LOGI(TAG, "=========================================");
    
    // Main loop idle
    while (1) {
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}
