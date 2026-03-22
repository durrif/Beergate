/**
 * @file panel_test.h
 * @brief Header para test de panel LCD sin LVGL
 */

#ifndef PANEL_TEST_H
#define PANEL_TEST_H

#ifdef __cplusplus
extern "C" {
#endif

/**
 * @brief Ejecuta test de hardware del panel LCD
 * 
 * Dibuja 3 franjas de colores:
 * - ROJO (superior)
 * - VERDE (centro)
 * - AZUL (inferior)
 * 
 * Si no se ve nada → problema de hardware
 * Si se ven colores → problema en LVGL
 */
void panel_test_run(void);

#ifdef __cplusplus
}
#endif

#endif // PANEL_TEST_H
