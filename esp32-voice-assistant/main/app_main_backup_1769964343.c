/**
 * @file app_main.c
 * @brief Test mínimo del BSP oficial ESP32-S3-BOX-3
 * 
 * Migración a ESP-IDF nativo usando BSP oficial de Espressif.
 * Inicializa el display con LVGL y muestra una UI simple para verificar funcionamiento.
 */

#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_log.h"
#include "nvs_flash.h"
#include "bsp/esp-bsp.h"

static const char *TAG = "APP_MAIN";

/**
 * @brief Callback del timer de LVGL para actualizar animaciones
 */
static void lvgl_animation_timer_cb(lv_timer_t *timer)
{
    // Obtener el label desde el user_data del timer
    lv_obj_t *label = (lv_obj_t *)timer->user_data;
    
    // Rotar texto para mostrar "actividad"
    static uint8_t counter = 0;
    const char *symbols[] = {"⚡", "✓", "●", "♥"};
    
    char text[64];
    snprintf(text, sizeof(text), "OK BSP BOX-3 %s", symbols[counter % 4]);
    lv_label_set_text(label, text);
    
    counter++;
}

/**
 * @brief Crea una UI simple con LVGL
 */
static void create_simple_ui(void)
{
    ESP_LOGI(TAG, "Creando UI LVGL...");
    
    // Obtener el lock de LVGL para crear objetos
    bsp_display_lock(0);
    
    // Crear pantalla principal con fondo oscuro
    lv_obj_t *screen = lv_obj_create(NULL);
    lv_obj_set_style_bg_color(screen, lv_color_hex(0x1a1a2e), 0);
    lv_scr_load(screen);
    
    // Label principal centrado
    lv_obj_t *label_main = lv_label_create(screen);
    lv_label_set_text(label_main, "OK BSP BOX-3 ⚡");
    lv_obj_set_style_text_color(label_main, lv_color_hex(0x00ff88), 0);
    lv_obj_set_style_text_font(label_main, &lv_font_montserrat_20, 0);
    lv_obj_align(label_main, LV_ALIGN_CENTER, 0, -20);
    
    // Label secundario con información
    lv_obj_t *label_info = lv_label_create(screen);
    lv_label_set_text(label_info, "BSP Oficial Espressif\nESP-IDF 5.5 Nativo");
    lv_obj_set_style_text_color(label_info, lv_color_white(), 0);
    lv_obj_set_style_text_font(label_info, &lv_font_montserrat_14, 0);
    lv_obj_set_style_text_align(label_info, LV_TEXT_ALIGN_CENTER, 0);
    lv_obj_align(label_info, LV_ALIGN_CENTER, 0, 20);
    
    // Icono decorativo (círculo de color)
    lv_obj_t *icon = lv_obj_create(screen);
    lv_obj_set_size(icon, 50, 50);
    lv_obj_align(icon, LV_ALIGN_TOP_MID, 0, 30);
    lv_obj_set_style_bg_color(icon, lv_color_hex(0xff6b9d), 0);
    lv_obj_set_style_radius(icon, 25, 0);
    lv_obj_set_style_border_width(icon, 3, 0);
    lv_obj_set_style_border_color(icon, lv_color_white(), 0);
    
    // Timer para animar el label principal (1 Hz)
    lv_timer_t *anim_timer = lv_timer_create(lvgl_animation_timer_cb, 1000, label_main);
    
    bsp_display_unlock();
    
    ESP_LOGI(TAG, "✅ UI LVGL creada correctamente");
}

void app_main(void)
{
    ESP_LOGI(TAG, "===========================================");
    ESP_LOGI(TAG, "  ESP32-S3-BOX-3 BSP OFICIAL TEST");
    ESP_LOGI(TAG, "  Migración a ESP-IDF 5.5 Nativo");
    ESP_LOGI(TAG, "===========================================");
    
    // 1. Inicializar NVS (requerido para algunas funciones del BSP)
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);
    ESP_LOGI(TAG, "✅ NVS inicializado");
    
    // 2. Inicializar display con LVGL usando BSP oficial
    ESP_LOGI(TAG, "Inicializando BSP display...");
    lv_disp_t *disp = bsp_display_start();
    if (disp == NULL) {
        ESP_LOGE(TAG, "❌ Error inicializando display BSP");
        return;
    }
    ESP_LOGI(TAG, "✅ BSP Display inicializado: %dx%d", 
             lv_disp_get_hor_res(disp), lv_disp_get_ver_res(disp));
    
    // 3. Activar backlight
    bsp_display_backlight_on();
    ESP_LOGI(TAG, "✅ Backlight encendido");
    
    // 4. Crear UI simple
    create_simple_ui();
    
    // 5. Loop principal - LVGL se maneja automáticamente por el BSP
    ESP_LOGI(TAG, "✅ Sistema listo. LVGL ejecutándose...");
    
    while (1) {
        // El BSP ya maneja lv_timer_handler() internamente
        // Solo necesitamos mantener la tarea viva
        vTaskDelay(pdMS_TO_TICKS(5000));
        ESP_LOGI(TAG, "Sistema funcionando OK");
    }
}
