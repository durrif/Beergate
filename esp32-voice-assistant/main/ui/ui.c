#include "ui.h"
#include "bsp/esp-bsp.h"
#include "esp_lvgl_port.h"
#include "esp_log.h"
#include "lvgl.h"
#include <string.h>

static const char *TAG = "UI";

// Assets externos
extern const lv_img_dsc_t cat_frame_0;
extern const lv_img_dsc_t cat_frame_1;
extern const lv_img_dsc_t cat_frame_2;
extern const lv_img_dsc_t cat_frame_3;

// UI State
static struct {
    lv_obj_t *screen;
    lv_obj_t *cat_sprite;
    lv_obj_t *status_label;
    lv_obj_t *vu_bars[10];
    lv_timer_t *anim_timer;
    ui_state_t current_state;
    uint8_t frame_index;
    float vu_levels[10];
    float vu_targets[10];
} ui_ctx = {0};

static const lv_img_dsc_t* cat_frames[] = {
    &cat_frame_0,
    &cat_frame_1,
    &cat_frame_2,
    &cat_frame_3
};

static const char* state_texts[] = {
    "Di 'Oye'...",
    "Escuchando...",
    "Pensando...",
    "Hablando..."
};

static const uint32_t state_fps[] = {
    2,   // IDLE
    8,   // LISTENING
    4,   // THINKING
    10   // SPEAKING
};

static void anim_timer_cb(lv_timer_t *timer)
{
    ui_ctx.frame_index = (ui_ctx.frame_index + 1) % 4;
    lv_img_set_src(ui_ctx.cat_sprite, cat_frames[ui_ctx.frame_index]);
    
    // Actualizar barras VU con decay
    for (int i = 0; i < 10; i++) {
        ui_ctx.vu_levels[i] += (ui_ctx.vu_targets[i] - ui_ctx.vu_levels[i]) * 0.3f;
        float jitter = (rand() % 10 - 5) / 100.0f;
        float level = ui_ctx.vu_levels[i] + jitter;
        if (level < 0) level = 0;
        if (level > 1) level = 1;
        
        int bar_h = (int)(level * 60);
        lv_obj_set_height(ui_ctx.vu_bars[i], bar_h);
    }
    
    // Parpadeo en THINKING
    if (ui_ctx.current_state == UI_THINKING) {
        static uint8_t alpha = 255;
        alpha = (alpha == 255) ? 128 : 255;
        lv_obj_set_style_text_opa(ui_ctx.status_label, alpha, 0);
    }
}

void ui_init(void)
{
    ESP_LOGI(TAG, "Inicializando UI...");
    
    bsp_display_cfg_t cfg = {
        .lvgl_port_cfg = ESP_LVGL_PORT_INIT_CONFIG(),
        .buffer_size = 320 * 50,
        .double_buffer = 1,
        .flags = {
            .buff_dma = 1,
            .buff_spiram = 0,
        }
    };
    
    bsp_display_start_with_config(&cfg);
    
    bsp_display_backlight_on();
    
    ESP_LOGI(TAG, "Display inicializado, creando UI...");
    
    bsp_display_lock(0);
    
    // Pantalla principal
    ui_ctx.screen = lv_obj_create(NULL);
    lv_obj_set_style_bg_color(ui_ctx.screen, lv_color_hex(0x1a1a2e), 0);
    lv_scr_load(ui_ctx.screen);
    
    // Sprite del gato (arriba-centro)
    ui_ctx.cat_sprite = lv_img_create(ui_ctx.screen);
    lv_img_set_src(ui_ctx.cat_sprite, &cat_frame_0);
    lv_obj_align(ui_ctx.cat_sprite, LV_ALIGN_TOP_MID, 0, 40);
    lv_img_set_zoom(ui_ctx.cat_sprite, 512);  // 2x
    
    // Label de estado (centro)
    ui_ctx.status_label = lv_label_create(ui_ctx.screen);
    lv_label_set_text(ui_ctx.status_label, state_texts[UI_IDLE]);
    lv_obj_set_style_text_color(ui_ctx.status_label, lv_color_white(), 0);
    lv_obj_set_style_text_font(ui_ctx.status_label, &lv_font_montserrat_24, 0);
    lv_obj_align(ui_ctx.status_label, LV_ALIGN_CENTER, 0, 20);
    
    // Barras VU (abajo)
    int bar_w = 24;
    int bar_spacing = 28;
    int total_w = 10 * bar_spacing;
    int start_x = (320 - total_w) / 2;
    
    for (int i = 0; i < 10; i++) {
        ui_ctx.vu_bars[i] = lv_obj_create(ui_ctx.screen);
        lv_obj_set_size(ui_ctx.vu_bars[i], bar_w, 5);
        lv_obj_set_pos(ui_ctx.vu_bars[i], start_x + i * bar_spacing, 200);
        lv_obj_set_style_bg_color(ui_ctx.vu_bars[i], lv_color_hex(0xff6b9d), 0);
        lv_obj_set_style_border_width(ui_ctx.vu_bars[i], 0, 0);
        lv_obj_clear_flag(ui_ctx.vu_bars[i], LV_OBJ_FLAG_SCROLLABLE);
        
        ui_ctx.vu_levels[i] = 0;
        ui_ctx.vu_targets[i] = 0;
    }
    
    // Timer de animación
    uint32_t period_ms = 1000 / state_fps[UI_IDLE];
    ui_ctx.anim_timer = lv_timer_create(anim_timer_cb, period_ms, NULL);
    
    ui_ctx.current_state = UI_IDLE;
    
    bsp_display_unlock();
    
    ESP_LOGI(TAG, "UI inicializada correctamente");
}

void ui_set_state(ui_state_t state)
{
    if (state == ui_ctx.current_state) return;
    
    bsp_display_lock(0);
    
    ui_ctx.current_state = state;
    lv_label_set_text(ui_ctx.status_label, state_texts[state]);
    lv_obj_set_style_text_opa(ui_ctx.status_label, 255, 0);
    
    uint32_t period_ms = 1000 / state_fps[state];
    lv_timer_set_period(ui_ctx.anim_timer, period_ms);
    
    bsp_display_unlock();
    
    ESP_LOGI(TAG, "Estado cambiado a: %s", state_texts[state]);
}

void ui_set_vu_level(float level_0_1)
{
    if (level_0_1 < 0) level_0_1 = 0;
    if (level_0_1 > 1) level_0_1 = 1;
    
    // Distribuir nivel en barras con patrón
    for (int i = 0; i < 10; i++) {
        float multiplier = 1.0f - (abs(i - 5) * 0.1f);
        ui_ctx.vu_targets[i] = level_0_1 * multiplier;
    }
}
