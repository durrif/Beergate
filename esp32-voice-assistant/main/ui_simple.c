/**
 * @file ui_simple.c
 * @brief UI SIMPLE con imágenes reales (NO procedural)
 * 
 * IMPORTANTE: Usa lv_img_dsc_t reales generadas con LVGL Image Converter
 * https://lvgl.io/tools/imageconverter
 */

#include "ui.h"
#include "bsp/esp-bsp.h"
#include "esp_log.h"
#include "lvgl.h"

// Importar imágenes reales desde ui_assets
extern const lv_img_dsc_t cat_frame_0;  // IDLE image
extern const lv_img_dsc_t cat_frame_1;  // LISTENING image

static const char *TAG = "UI";

// Estado de la UI
static struct {
    lv_obj_t *screen;
    lv_obj_t *cat_img;        // Imagen del gato (lv_img)
    lv_obj_t *status_label;   // "Listo", "Escuchando...", etc.
    lv_obj_t *transcript_label;  // Transcripción temporal
    lv_obj_t *vu_bars[10];    // VU meter (opcional)
    lv_timer_t *anim_timer;
    
    ui_state_t current_state;
    float vu_levels[10];
    float vu_targets[10];
    bool initialized;
} ui_ctx = {0};

static const char* state_texts[] = {
    "Listo",           // IDLE
    "Escuchando...",   // LISTENING
    "Pensando...",     // THINKING
    "Hablando..."      // SPEAKING
};

// Timer para VU meter smooth animation
static void anim_timer_cb(lv_timer_t *timer)
{
    if (!ui_ctx.initialized) return;
    
    // Smooth decay para VU bars
    for (int i = 0; i < 10; i++) {
        float diff = ui_ctx.vu_targets[i] - ui_ctx.vu_levels[i];
        ui_ctx.vu_levels[i] += diff * 0.3f;
        
        float level = ui_ctx.vu_levels[i];
        if (level < 0) level = 0;
        if (level > 1) level = 1;
        
        int bar_h = (int)(level * 50);
        lv_obj_set_height(ui_ctx.vu_bars[i], bar_h > 2 ? bar_h : 2);
    }
}

esp_err_t ui_init(void)
{
    ESP_LOGI(TAG, "Inicializando UI simple con imágenes reales...");
    
    if (ui_ctx.initialized) {
        ESP_LOGW(TAG, "UI ya inicializada");
        return ESP_OK;
    }
    
    // Pantalla principal (fondo degradado azul oscuro)
    ui_ctx.screen = lv_obj_create(NULL);
    lv_obj_set_style_bg_color(ui_ctx.screen, lv_color_hex(0x1a1a2e), 0);
    lv_obj_set_style_bg_grad_color(ui_ctx.screen, lv_color_hex(0x16213e), 0);
    lv_obj_set_style_bg_grad_dir(ui_ctx.screen, LV_GRAD_DIR_VER, 0);
    lv_scr_load(ui_ctx.screen);
    
    // ========================================
    // IMAGEN DEL GATO (centrada, arriba)
    // ========================================
    ui_ctx.cat_img = lv_img_create(ui_ctx.screen);
    
    // Cargar imagen inicial (IDLE)
    lv_img_set_src(ui_ctx.cat_img, &cat_frame_0);
    
    // Centrar horizontalmente, posición vertical 20px desde arriba
    lv_obj_align(ui_ctx.cat_img, LV_ALIGN_TOP_MID, 0, 20);
    
    ESP_LOGI(TAG, "Cat image: w=%d, h=%d", cat_frame_0.header.w, cat_frame_0.header.h);
    
    // ========================================
    // LABEL DE ESTADO (debajo del gato)
    // ========================================
    ui_ctx.status_label = lv_label_create(ui_ctx.screen);
    lv_label_set_text(ui_ctx.status_label, state_texts[UI_STATE_IDLE]);
    
    // Fuente grande (montserrat_22)
    lv_obj_set_style_text_font(ui_ctx.status_label, &lv_font_montserrat_22, 0);
    
    // Texto blanco con sombra
    lv_obj_set_style_text_color(ui_ctx.status_label, lv_color_white(), 0);
    lv_obj_set_style_shadow_width(ui_ctx.status_label, 10, 0);
    lv_obj_set_style_shadow_opa(ui_ctx.status_label, LV_OPA_50, 0);
    lv_obj_set_style_shadow_color(ui_ctx.status_label, lv_color_black(), 0);
    
    // Centrar horizontalmente, ~130px desde arriba (debajo del gato)
    lv_obj_align(ui_ctx.status_label, LV_ALIGN_TOP_MID, 0, 130);
    
    // ========================================
    // LABEL DE TRANSCRIPCIÓN (temporal)
    // ========================================
    ui_ctx.transcript_label = lv_label_create(ui_ctx.screen);
    lv_label_set_text(ui_ctx.transcript_label, "");
    lv_obj_set_width(ui_ctx.transcript_label, 280);
    lv_label_set_long_mode(ui_ctx.transcript_label, LV_LABEL_LONG_WRAP);
    
    lv_obj_set_style_text_font(ui_ctx.transcript_label, &lv_font_montserrat_14, 0);
    lv_obj_set_style_text_color(ui_ctx.transcript_label, lv_color_hex(0xE0E0E0), 0);
    lv_obj_align(ui_ctx.transcript_label, LV_ALIGN_CENTER, 0, 40);
    
    // ========================================
    // VU METER (barras en la parte inferior)
    // ========================================
    int bar_w = 24;
    int bar_spacing = 28;
    int total_w = 10 * bar_spacing;
    int start_x = (320 - total_w) / 2;
    
    for (int i = 0; i < 10; i++) {
        ui_ctx.vu_bars[i] = lv_obj_create(ui_ctx.screen);
        lv_obj_set_size(ui_ctx.vu_bars[i], bar_w, 2);
        lv_obj_set_pos(ui_ctx.vu_bars[i], start_x + i * bar_spacing, 210);
        
        lv_obj_set_style_bg_color(ui_ctx.vu_bars[i], lv_color_hex(0x00FF88), 0);
        lv_obj_set_style_bg_grad_color(ui_ctx.vu_bars[i], lv_color_hex(0xFF6B9D), 0);
        lv_obj_set_style_bg_grad_dir(ui_ctx.vu_bars[i], LV_GRAD_DIR_VER, 0);
        lv_obj_set_style_border_width(ui_ctx.vu_bars[i], 0, 0);
        lv_obj_set_style_radius(ui_ctx.vu_bars[i], 2, 0);
        lv_obj_clear_flag(ui_ctx.vu_bars[i], LV_OBJ_FLAG_SCROLLABLE);
        
        ui_ctx.vu_levels[i] = 0;
        ui_ctx.vu_targets[i] = 0;
    }
    
    // Timer para animación VU meter
    ui_ctx.anim_timer = lv_timer_create(anim_timer_cb, 33, NULL);  // ~30 FPS
    
    ui_ctx.current_state = UI_STATE_IDLE;
    ui_ctx.initialized = true;
    
    ESP_LOGI(TAG, "✅ UI simple inicializada (usando lv_img reales)");
    
    return ESP_OK;
}

void ui_set_state(ui_state_t state, const char *text)
{
    if (!ui_ctx.initialized) return;
    
    bsp_display_lock(0);
    
    ui_ctx.current_state = state;
    
    // Cambiar imagen según estado
    const lv_img_dsc_t *new_img = NULL;
    switch (state) {
        case UI_STATE_IDLE:
            new_img = &cat_frame_0;  // Gato tranquilo
            break;
        case UI_STATE_LISTENING:
        case UI_STATE_THINKING:
        case UI_STATE_SPEAKING:
            new_img = &cat_frame_1;  // Gato activo (orejas levantadas, ojos abiertos)
            break;
    }
    
    if (new_img) {
        lv_img_set_src(ui_ctx.cat_img, new_img);
    }
    
    // Actualizar texto de estado
    lv_label_set_text(ui_ctx.status_label, state_texts[state]);
    
    // Si hay texto adicional (transcripción), mostrarlo
    if (text && strlen(text) > 0) {
        lv_label_set_text(ui_ctx.transcript_label, text);
    } else {
        lv_label_set_text(ui_ctx.transcript_label, "");
    }
    
    bsp_display_unlock();
    
    ESP_LOGI(TAG, "Estado: %s", state_texts[state]);
}

void ui_set_vu_level(float level_0_1)
{
    if (!ui_ctx.initialized) return;
    
    if (level_0_1 < 0) level_0_1 = 0;
    if (level_0_1 > 1) level_0_1 = 1;
    
    // Distribuir nivel en barras (patrón parabólico centrado)
    for (int i = 0; i < 10; i++) {
        float pos = (float)i / 9.0f;
        float multiplier = 1.0f - powf(fabsf(pos - 0.5f) * 2.0f, 1.5f);
        ui_ctx.vu_targets[i] = level_0_1 * multiplier;
    }
}

ui_state_t ui_get_state(void)
{
    return ui_ctx.current_state;
}
