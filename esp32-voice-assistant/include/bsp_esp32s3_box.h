/**
 * @file bsp_esp32s3_box.h
 * @brief BSP simplificado para ESP32-S3-BOX-3
 */

#ifndef BSP_ESP32S3_BOX_H
#define BSP_ESP32S3_BOX_H

#include "esp_err.h"
#include "lvgl.h"
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/**
 * @brief Inicializa el board (stub para compatibilidad con BSP)
 * @return ESP_OK
 */
esp_err_t bsp_board_init(void);

/**
 * @brief Inicializa el display y LVGL
 * 
 * Esta función:
 * - Configura SPI
 * - Inicializa driver LCD ST7789
 * - Configura LVGL con buffers DMA
 * - Crea tarea LVGL
 * - Retorna display handle
 * 
 * @return Display LVGL handle o NULL si falla
 */
lv_disp_t *bsp_display_start(void);

/**
 * @brief Enciende el backlight
 * @return ESP_OK
 */
esp_err_t bsp_display_backlight_on(void);

/**
 * @brief Apaga el backlight
 * @return ESP_OK
 */
esp_err_t bsp_display_backlight_off(void);

/**
 * @brief Bloquea LVGL para uso thread-safe
 * @param timeout_ms Timeout en ms (0 = espera infinita)
 * @return true si lock exitoso
 */
bool bsp_display_lock(uint32_t timeout_ms);

/**
 * @brief Libera lock de LVGL
 */
void bsp_display_unlock(void);

/**
 * @brief Tarea LVGL (uso interno)
 * @param pvParameters Parámetros (no usados)
 */
void bsp_lvgl_task(void *pvParameters);

#ifdef __cplusplus
}
#endif

#endif // BSP_ESP32S3_BOX_H
