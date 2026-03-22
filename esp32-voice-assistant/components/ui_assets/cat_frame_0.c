/**
 * @file cat_frame_0.c
 * @brief Cat sprite frame 0 - Generated from PNG with LVGL Image Converter
 * 
 * CÓMO GENERAR ESTE ARCHIVO:
 * 1. Ir a: https://lvgl.io/tools/imageconverter
 * 2. Subir PNG del gato (IMPORTANTE: 120x120px, fondo transparente si quieres)
 * 3. Configuración CRÍTICA:
 *    - Color format: CF_TRUE_COLOR (RGB565 sin alpha - más eficiente)
 *    - Output format: C array
 *    - Binary format: Little endian
 *    - Name: cat_frame_0
 * 4. Descargar y reemplazar SOLO el contenido de cat_frame_0_data.inc
 * 
 * FORMATO ESPERADO: RGB565 (16-bit) para LV_COLOR_DEPTH=16
 * Tamaño: 120x120 = 14400 pixels * 2 bytes = 28800 bytes
 * NOTA: NO uses imágenes mayores a 240x240 (crashea el display)
 */

#include "lvgl.h"

#ifndef LV_ATTRIBUTE_MEM_ALIGN
#define LV_ATTRIBUTE_MEM_ALIGN
#endif

#ifndef LV_ATTRIBUTE_IMG_CAT_FRAME_0
#define LV_ATTRIBUTE_IMG_CAT_FRAME_0
#endif

// Cat frame 0 - IDLE/Neutral pose (120x120 RGB565)
// Optimized size for 320x240 display
const LV_ATTRIBUTE_MEM_ALIGN LV_ATTRIBUTE_LARGE_CONST LV_ATTRIBUTE_IMG_CAT_FRAME_0 uint8_t cat_frame_0_map[] = {
  #include "cat_frame_0_data.inc"
};

const lv_img_dsc_t cat_frame_0 = {
  .header.cf = LV_IMG_CF_TRUE_COLOR,
  .header.always_zero = 0,
  .header.reserved = 0,
  .header.w = 120,
  .header.h = 120,
  .data_size = 120 * 120 * LV_COLOR_SIZE / 8,
  .data = cat_frame_0_map,
};
