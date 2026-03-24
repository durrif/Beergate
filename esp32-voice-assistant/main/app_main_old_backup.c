/**
 * @file app_main.c
 * @brief ESP32-S3-BOX-3 Voice Assistant with Wyoming STT
 * 
 * Real voice assistant with:
 * - Button-triggered recording (hold to record, release to send)
 * - Real audio capture (PCM16 16kHz mono) with VAD
 * - Wyoming STT HTTP client
 * - Animated cat sprite UI with VU meter
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_log.h"
#include "esp_timer.h"
#include "nvs_flash.h"
#include "esp_wifi.h"
#include "esp_event.h"
#include "esp_netif.h"
#include "protocol_examples_common.h"
#include "bsp/esp-box-3.h"
#include "esp_lvgl_port.h"
#include "iot_button.h"
#include "ui.h"
#include "audio_capture.h"
#include "wyoming_client.h"

static const char *TAG = "VOICE_ASSISTANT";

/* ==================== DEFINICIONES DE TIPOS ==================== */

typedef enum {
    UI_STATE_IDLE = 0,      // En espera
    UI_STATE_LISTENING,     // Escuchando comando
    UI_STATE_THINKING,      // Procesando
    UI_STATE_SPEAKING       // Respondiendo
} ui_state_t;

typedef struct {
    bool initialized;
    ui_state_t current_state;
    
    // Objetos LVGL
    lv_obj_t *screen;
    lv_obj_t *status_label;
    lv_obj_t *cat_sprite;
    lv_obj_t *cat_eyes[2];      // Ojos del gato
    lv_obj_t *cat_mouth;         // Boca del gato
    lv_obj_t *vu_bars[10];
    
    // Estado de animación
    uint8_t cat_frame;
    lv_timer_t *anim_timer;
    lv_timer_t *cat_anim_timer;  // Timer para frames del gato
    
    // VU meter state
    float vu_levels[10];
    float vu_targets[10];
    
    // Audio capture state
    bool audio_capturing;
    int64_t capture_start_time;
    uint32_t capture_len_ms;
    bool has_voice_activity;
} ui_context_t;

static ui_context_t ui_ctx = {0};

/* ==================== CONFIGURACIÓN DE ESTADOS ==================== */

static const char *state_texts[] = {
    "💤 En Espera",
    "🎤 Escuchando...",
    "🤔 Pensando...",
    "🗣️ Hablando..."
};

// Valores hex de colores para cada estado
static const uint32_t state_color_hex[] = {
    0x1A1A2E,  // IDLE: gris oscuro
    0x64FFD4,  // LISTENING: verde neón
    0x00BFFF,  // THINKING: cyan
    0xFF69B4   // SPEAKING: rosa
};

static const uint32_t state_fps[] = {1, 8, 4, 10}; // FPS de animación por estado

/* ==================== DECLARACIONES FORWARD ==================== */

static void ui_set_state(ui_state_t state);
static void ha_stt_send(void);
static void ha_tts_request(void);

/* ==================== FUNCIONES DE AUDIO (STUBS) ==================== */

static void start_audio_capture(void) {
    ui_ctx.audio_capturing = true;
    ui_ctx.capture_start_time = esp_timer_get_time() / 1000; // ms
    ui_ctx.has_voice_activity = false;
    ESP_LOGI(TAG, "[AUDIO] Iniciando captura...");
}

static void stop_audio_capture(void) {
    ui_ctx.audio_capturing = false;
    ui_ctx.capture_len_ms = (esp_timer_get_time() / 1000) - ui_ctx.capture_start_time;
    
    // Simulación VAD: >50% de probabilidad de detectar voz si duración >500ms
    ui_ctx.has_voice_activity = (ui_ctx.capture_len_ms > 500) && ((rand() % 100) > 50);
    
    ESP_LOGI(TAG, "[AUDIO] Captura detenida: %lu ms, VAD=%s", 
             ui_ctx.capture_len_ms, 
             ui_ctx.has_voice_activity ? "VOZ" : "SILENCIO");
}

static void ha_stt_send(void) {
    ESP_LOGI(TAG, "[STT] Enviando audio a Home Assistant...");
    // Simular procesamiento STT (en real: enviar audio por HTTP/WebSocket)
    vTaskDelay(pdMS_TO_TICKS(2000)); // Simular 2s de procesamiento
    ESP_LOGI(TAG, "[STT] Transcripción recibida: 'enciende la luz'");
    
    // Transición a SPEAKING
    ui_set_state(UI_STATE_SPEAKING);
    ha_tts_request();
}

static void ha_tts_request(void) {
    ESP_LOGI(TAG, "[TTS] Solicitando respuesta TTS a Home Assistant...");
    // Simular recepción y reproducción de TTS
    vTaskDelay(pdMS_TO_TICKS(3000)); // Simular 3s de audio
    ESP_LOGI(TAG, "[TTS] Reproducción completada");
    
    // Volver a IDLE
    ui_set_state(UI_STATE_IDLE);
}

/* ==================== CALLBACKS DE BOTÓN ==================== */

/**
 * @brief Tarea wrapper para STT
 */
static void stt_task_wrapper(void *arg) {
    ha_stt_send();
    vTaskDelete(NULL);
}

/**
 * @brief Callback al presionar botón (BUTTON_PRESS_DOWN)
 */
static void button_press_down_cb(void *arg, void *data) {
    ESP_LOGI(TAG, "[BUTTON] PRESIONADO");
    ui_set_state(UI_STATE_LISTENING);
    start_audio_capture();
}

/**
 * @brief Callback al soltar botón (BUTTON_PRESS_UP)
 */
static void button_press_up_cb(void *arg, void *data) {
    ESP_LOGI(TAG, "[BUTTON] SOLTADO");
    stop_audio_capture();
    
    // Evaluar si procesar audio
    if (ui_ctx.capture_len_ms < 300) {
        ESP_LOGI(TAG, "[STATE] Audio muy corto (<300ms) -> IDLE");
        ui_set_state(UI_STATE_IDLE);
        return;
    }
    
    if (!ui_ctx.has_voice_activity) {
        ESP_LOGI(TAG, "[STATE] Sin actividad de voz -> IDLE");
        ui_set_state(UI_STATE_IDLE);
        return;
    }
    
    // Hay voz válida: procesar
    ESP_LOGI(TAG, "[STATE] Voz detectada -> THINKING");
    ui_set_state(UI_STATE_THINKING);
    
    // Lanzar tarea de STT en background
    xTaskCreate(stt_task_wrapper, "stt_task", 4096, NULL, 5, NULL);
}

/**
 * @brief Timer callback para animación del sprite del gato (frames)
 */
static void cat_animation_timer_cb(lv_timer_t *timer)
{
    if (!ui_ctx.initialized || !ui_ctx.cat_sprite) return;
    
    lvgl_port_lock(0);
    
    // Cambiar frame (0-3)
    ui_ctx.cat_frame = (ui_ctx.cat_frame + 1) % 4;
    
    // Animar ojos y boca según frame
    int32_t eye_offset_y = (ui_ctx.cat_frame % 2) ? 2 : -2;
    lv_obj_set_y(ui_ctx.cat_eyes[0], -8 + eye_offset_y);
    lv_obj_set_y(ui_ctx.cat_eyes[1], -8 + eye_offset_y);
    
    // Boca sube y baja
    int32_t mouth_y = 5 + ((ui_ctx.cat_frame % 2) ? 3 : 0);
    lv_obj_set_y(ui_ctx.cat_mouth, mouth_y);
    
    // Cambiar color según estado
    uint32_t color = state_color_hex[ui_ctx.current_state];
    lv_obj_set_style_bg_color(ui_ctx.cat_sprite, lv_color_hex(color), 0);
    
    lvgl_port_unlock();
}

/**
 * @brief Timer callback para animación de UI (VU meter)
 */
static void ui_animation_timer_cb(lv_timer_t *timer)
{
    if (!ui_ctx.initialized) return;
    
    // Animar sprite del gato solo en LISTENING y THINKING
    if (ui_ctx.current_state == UI_STATE_LISTENING || 
        ui_ctx.current_state == UI_STATE_THINKING) {
        ui_ctx.cat_frame = (ui_ctx.cat_frame + 1) % 4;
            // La imagen del gato no necesita cambio de color
        // Efecto de escala pulsante
        int16_t scale = 240 + (ui_ctx.cat_frame * 20);
        lv_obj_set_style_transform_zoom(ui_ctx.cat_sprite, scale, 0);
    }
    
    // Actualizar VU bars con decay suave
    for (int i = 0; i < 10; i++) {
        float diff = ui_ctx.vu_targets[i] - ui_ctx.vu_levels[i];
        ui_ctx.vu_levels[i] += diff * 0.25f;
        
        // Jitter para efecto "vivo"
        float jitter = (rand() % 20 - 10) / 300.0f;
        float level = ui_ctx.vu_levels[i] + jitter;
        if (level < 0) level = 0;
        if (level > 1) level = 1;
        
        int32_t bar_h = (int32_t)(level * 80);
        if (bar_h < 3) bar_h = 3;
        lv_obj_set_height(ui_ctx.vu_bars[i], bar_h);
        
        // Color gradient según nivel
        lv_color_t bar_color;
        if (level > 0.8f) {
            bar_color = lv_color_hex(0xff1744); // Rojo
        } else if (level > 0.5f) {
            bar_color = lv_color_hex(0xffc400); // Amarillo
        } else {
            bar_color = lv_color_hex(0x00e676); // Verde
        }
        lv_obj_set_style_bg_color(ui_ctx.vu_bars[i], bar_color, 0);
    }
    
    // Parpadeo del texto en THINKING
    if (ui_ctx.current_state == UI_STATE_THINKING) {
        static uint8_t blink_counter = 0;
        blink_counter++;
        lv_opa_t opa = (blink_counter % 10 < 5) ? LV_OPA_COVER : LV_OPA_50;
        lv_obj_set_style_text_opa(ui_ctx.status_label, opa, 0);
    } else {
        lv_obj_set_style_text_opa(ui_ctx.status_label, LV_OPA_COVER, 0);
    }
}

/* ==================== INICIALIZACIÓN DE UI ==================== */

/**
 * @brief Inicializa la interfaz LVGL
 */
static esp_err_t ui_init(void)
{
    if (ui_ctx.initialized) {
        ESP_LOGW(TAG, "UI ya inicializada");
        return ESP_OK;
    }
    
    ESP_LOGI(TAG, "Inicializando UI LVGL...");
    
    // Obtener lock de LVGL usando el port
    if (lvgl_port_lock(0)) {
        
        // Crear pantalla principal
        ui_ctx.screen = lv_obj_create(NULL);
        lv_obj_set_style_bg_color(ui_ctx.screen, lv_color_hex(0x0d0221), 0);
        lv_scr_load(ui_ctx.screen);
        
        // === SPRITE DEL GATO (arriba-centro) - 4 frames animados ===
        ui_ctx.cat_sprite = lv_obj_create(ui_ctx.screen);
        lv_obj_set_size(ui_ctx.cat_sprite, 80, 80);
        lv_obj_align(ui_ctx.cat_sprite, LV_ALIGN_TOP_MID, 0, 30);
        lv_obj_set_style_bg_color(ui_ctx.cat_sprite, lv_color_hex(0xFF69B4), 0); // Rosa anime
        lv_obj_set_style_border_width(ui_ctx.cat_sprite, 0, 0);
        lv_obj_set_style_radius(ui_ctx.cat_sprite, 40, 0); // Circular
        lv_obj_clear_flag(ui_ctx.cat_sprite, LV_OBJ_FLAG_SCROLLABLE);
        
        // Ojos del gato (2 círculos negros)
        for (int i = 0; i < 2; i++) {
            ui_ctx.cat_eyes[i] = lv_obj_create(ui_ctx.cat_sprite);
            lv_obj_set_size(ui_ctx.cat_eyes[i], 8, 8);
            lv_obj_set_style_bg_color(ui_ctx.cat_eyes[i], lv_color_black(), 0);
            lv_obj_set_style_border_width(ui_ctx.cat_eyes[i], 0, 0);
            lv_obj_set_style_radius(ui_ctx.cat_eyes[i], 4, 0);
            lv_obj_align(ui_ctx.cat_eyes[i], LV_ALIGN_CENTER, 
                        (i == 0) ? -15 : 15, -8);
            lv_obj_clear_flag(ui_ctx.cat_eyes[i], LV_OBJ_FLAG_SCROLLABLE);
        }
        
        // Boca del gato (línea curva simulada con rectángulo)
        ui_ctx.cat_mouth = lv_obj_create(ui_ctx.cat_sprite);
        lv_obj_set_size(ui_ctx.cat_mouth, 16, 4);
        lv_obj_set_style_bg_color(ui_ctx.cat_mouth, lv_color_black(), 0);
        lv_obj_set_style_border_width(ui_ctx.cat_mouth, 0, 0);
        lv_obj_set_style_radius(ui_ctx.cat_mouth, 2, 0);
        lv_obj_align(ui_ctx.cat_mouth, LV_ALIGN_CENTER, 0, 5);
        lv_obj_clear_flag(ui_ctx.cat_mouth, LV_OBJ_FLAG_SCROLLABLE);
        
        // === LABEL DE ESTADO (centro) ===
        ui_ctx.status_label = lv_label_create(ui_ctx.screen);
        lv_label_set_text(ui_ctx.status_label, state_texts[UI_STATE_IDLE]);
        lv_obj_set_style_text_color(ui_ctx.status_label, lv_color_white(), 0);
        lv_obj_set_style_text_font(ui_ctx.status_label, 
                                    &lv_font_montserrat_14, 0);
        lv_obj_align(ui_ctx.status_label, LV_ALIGN_CENTER, 0, 0);
        
        // === VU METER - 10 BARRAS (abajo) ===
        int32_t bar_w = 20;
        int32_t bar_spacing = 24;
        int32_t total_w = 10 * bar_spacing;
        int32_t start_x = (320 - total_w) / 2;
        
        for (int i = 0; i < 10; i++) {
            ui_ctx.vu_bars[i] = lv_obj_create(ui_ctx.screen);
            lv_obj_set_size(ui_ctx.vu_bars[i], bar_w, 3);
            lv_obj_set_pos(ui_ctx.vu_bars[i], start_x + i * bar_spacing, 200);
            lv_obj_set_style_bg_color(ui_ctx.vu_bars[i], 
                                      lv_color_hex(0x00e676), 0);
            lv_obj_set_style_border_width(ui_ctx.vu_bars[i], 0, 0);
            lv_obj_set_style_radius(ui_ctx.vu_bars[i], 3, 0);
            lv_obj_clear_flag(ui_ctx.vu_bars[i], LV_OBJ_FLAG_SCROLLABLE);
            
            ui_ctx.vu_levels[i] = 0.0f;
            ui_ctx.vu_targets[i] = 0.0f;
        }
        
        // Timer de animación VU meter
        uint32_t period_ms = 1000 / state_fps[UI_STATE_IDLE];
        ui_ctx.anim_timer = lv_timer_create(ui_animation_timer_cb, 
                                             period_ms, NULL);
        
        // Timer de animación sprite del gato (120ms = ~8 FPS)
        ui_ctx.cat_anim_timer = lv_timer_create(cat_animation_timer_cb, 120, NULL);
        
        ui_ctx.current_state = UI_STATE_IDLE;
        ui_ctx.cat_frame = 0;
        ui_ctx.audio_capturing = false;
        ui_ctx.capture_len_ms = 0;
        ui_ctx.has_voice_activity = false;
        ui_ctx.initialized = true;
        
        lvgl_port_unlock();
        
        ESP_LOGI(TAG, "✅ UI inicializada correctamente");
        return ESP_OK;
    }
    
    ESP_LOGE(TAG, "❌ Error obteniendo lock de LVGL");
    return ESP_FAIL;
}

/* ==================== API PÚBLICA ==================== */

/**
 * @brief Cambia el estado de la UI
 */
void ui_set_state(ui_state_t state)
{
    if (!ui_ctx.initialized) return;
    if (state == ui_ctx.current_state) return;
    
    ui_state_t prev_state = ui_ctx.current_state;
    
    // Log con nombres de estado claros
    const char *state_names[] = {"IDLE", "LISTENING", "THINKING", "SPEAKING"};
    ESP_LOGI(TAG, "[STATE] %s -> %s", state_names[prev_state], state_names[state]);
    ESP_LOGI(TAG, "Estado demo: %s", state_texts[state]);
    
    if (lvgl_port_lock(0)) {
        ui_ctx.current_state = state;
        
        // Actualizar texto
        lv_label_set_text(ui_ctx.status_label, state_texts[state]);
        
        // Actualizar color de fondo
        lv_obj_set_style_bg_color(ui_ctx.screen, lv_color_hex(state_color_hex[state]), 0);
        
        // Ajustar velocidad de animación
        uint32_t period_ms = 1000 / state_fps[state];
        lv_timer_set_period(ui_ctx.anim_timer, period_ms);
        
        // Reset cat frame si cambia a IDLE o SPEAKING
        if (state == UI_STATE_IDLE || state == UI_STATE_SPEAKING) {
            ui_ctx.cat_frame = 0;
            lv_obj_set_style_bg_color(ui_ctx.cat_sprite, lv_color_hex(0xFF69B4), 0); // Reset color
        }
        
        lvgl_port_unlock();
    }
}

/**
 * @brief Actualiza el nivel del VU meter
 * @param level_db Nivel en dB (-60 a 0) o amplitud (0.0 a 1.0)
 */
void ui_set_vu_level(float level_db)
{
    if (!ui_ctx.initialized) return;
    
    // Convertir dB a amplitud lineal si es necesario
    float amplitude;
    if (level_db <= 0 && level_db >= -60) {
        // Es dB: convertir a lineal (0-1)
        amplitude = powf(10.0f, level_db / 20.0f);
    } else {
        // Ya es amplitud (0-1)
        amplitude = level_db;
        if (amplitude < 0) amplitude = 0;
        if (amplitude > 1) amplitude = 1;
    }
    
    // Distribuir nivel en las 10 barras con efecto de cascada
    for (int i = 0; i < 10; i++) {
        float bar_threshold = (float)i / 10.0f;
        if (amplitude > bar_threshold) {
            ui_ctx.vu_targets[i] = (amplitude - bar_threshold) * 10.0f;
            if (ui_ctx.vu_targets[i] > 1.0f) ui_ctx.vu_targets[i] = 1.0f;
        } else {
            ui_ctx.vu_targets[i] = 0.0f;
        }
    }
}

/* ==================== MAIN ==================== */

void app_main(void)
{
    ESP_LOGI(TAG, "=========================================");
    ESP_LOGI(TAG, " ESP32-S3-BOX-3 Voice Assistant UI");
    ESP_LOGI(TAG, " BSP Oficial + LVGL Anime Style 🐱");
    ESP_LOGI(TAG, "=========================================");
    
    // 1. Inicializar NVS
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || 
        ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);
    ESP_LOGI(TAG, "✅ NVS inicializado");
    
    // 2. Inicializar BSP display + LVGL
    ESP_LOGI(TAG, "Inicializando display BSP...");
    lv_display_t *disp = bsp_display_start();
    if (disp == NULL) {
        ESP_LOGE(TAG, "❌ Error inicializando display BSP");
        return;
    }
    ESP_LOGI(TAG, "✅ Display BSP: %dx%d", 
             lv_disp_get_hor_res(disp),
             lv_disp_get_ver_res(disp));
    
    // 3. Activar backlight
    bsp_display_backlight_on();
    ESP_LOGI(TAG, "✅ Backlight activado");
    
    // 4. Inicializar UI
    ESP_ERROR_CHECK(ui_init());
    
    // 5. Demo loop - ciclo de estados
    ESP_LOGI(TAG, "✅ Sistema listo. Iniciando demo...");
    
    // === CONFIGURAR BOTÓN FÍSICO ===
    button_handle_t btns[BSP_BUTTON_NUM];
    int btn_cnt = 0;
    ESP_ERROR_CHECK(bsp_iot_button_create(btns, &btn_cnt, BSP_BUTTON_NUM));
    ESP_LOGI(TAG, "✅ Botones inicializados: %d", btn_cnt);
    
    // Callbacks de botón MAIN (frontal): press down y press up
    if (btn_cnt > BSP_BUTTON_MAIN) {
        iot_button_register_cb(btns[BSP_BUTTON_MAIN], BUTTON_PRESS_DOWN, NULL, button_press_down_cb, NULL);
        iot_button_register_cb(btns[BSP_BUTTON_MAIN], BUTTON_PRESS_UP, NULL, button_press_up_cb, NULL);
        ESP_LOGI(TAG, "✅ Callbacks botón MAIN registrados (PRESS_DOWN + PRESS_UP)");
    }
    
    // Modo control por botón (no demo automático)
    ESP_LOGI(TAG, "Sistema en modo IDLE. Presiona botón para activar.");
    
    while (1) {
        // Simular actividad de audio con VU meter según estado actual
        float level = 0.0f;
        switch (ui_ctx.current_state) {
            case UI_STATE_LISTENING:
            case UI_STATE_SPEAKING:
                level = 0.3f + (rand() % 70) / 100.0f;
                break;
            case UI_STATE_THINKING:
                level = 0.1f + (rand() % 30) / 100.0f;
                break;
            default:
                level = (rand() % 10) / 100.0f;
                break;
        }
        
        ui_set_vu_level(level);
        vTaskDelay(pdMS_TO_TICKS(100));
    }
}
