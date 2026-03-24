#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_log.h"
#include "esp_system.h"
#include "nvs_flash.h"
#include "bsp/esp-bsp.h"
#include "ui.h"

static const char *TAG = "MAIN";

void app_main(void)
{
    ESP_LOGI(TAG, "===========================================");
    ESP_LOGI(TAG, "ESP32-S3-BOX-3 - BSP OFICIAL + LVGL UI");
    ESP_LOGI(TAG, "===========================================");
    
    // NVS
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);
    
    // Inicializar UI con BSP oficial
    ui_init();
    
    ESP_LOGI(TAG, "Sistema listo");
    
    // Test de estados
    uint8_t test_state = 0;
    float vu_level = 0;
    
    while (1) {
        vTaskDelay(pdMS_TO_TICKS(3000));
        
        // Ciclar estados
        test_state = (test_state + 1) % 4;
        ui_set_state((ui_state_t)test_state);
        
        // Simular VU
        vu_level = (rand() % 100) / 100.0f;
        ui_set_vu_level(vu_level);
        
        ESP_LOGI(TAG, "Heap libre: %lu bytes", esp_get_free_heap_size());
    }
}
