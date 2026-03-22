/**
 * @file ui_lvgl.h
 * @brief Interfaz gráfica LVGL con mascota gato animada
 * 
 * Pantalla 320x240 ESP32-S3-BOX con:
 * - Avatar de gato central con animación por estados
 * - VU meter (barra de nivel) durante LISTENING
 * - Texto de estado y transcripción
 * - Animaciones suaves
 * 
 * Estados visuales:
 * - IDLE: Gato tranquilo con parpadeo lento
 * - LISTENING: Orejas arriba + VU meter activo
 * - THINKING: Animación de "pensando..." (3 puntos)
 * - SPEAKING: Boca moviéndose al ritmo del audio
 * 
 * API:
 * - ui_init(): Inicializa LVGL + pantalla
 * - ui_set_state(state): Cambia estado visual
 * - ui_set_transcript(text): Muestra texto reconocido
 * - ui_set_response(text): Muestra respuesta TTS
 * - ui_set_vu_level(level): Actualiza VU meter (0-100)
 * 
 * Cómo convertir sprites PNG a C arrays:
 * 1. Instalar lv_img_conv: npm install -g lv_img_conv
 * 2. Convertir: lv_img_conv gato_idle.png -f -c RGB565 -o gato_idle.c
 * 3. Incluir en assets/ y agregar extern en ui_lvgl.h
 * 4. Referenciar: lv_img_set_src(img, &gato_idle);
 */

#ifndef UI_LVGL_H
#define UI_LVGL_H

#include <stdint.h>
#include <stdbool.h>
#include "esp_err.h"

#ifdef __cplusplus
extern "C" {
#endif

/**
 * Estados visuales de la UI
 */
typedef enum {
    UI_STATE_IDLE = 0,       ///< Listo, esperando
    UI_STATE_LISTENING,      ///< Escuchando comando
    UI_STATE_THINKING,       ///< Procesando (enviando a HA)
    UI_STATE_SPEAKING,       ///< Reproduciendo respuesta TTS
    UI_STATE_ERROR           ///< Error
} ui_state_t;

/**
 * Configuración de la UI
 */
typedef struct {
    uint16_t screen_width;       ///< Ancho de pantalla (320)
    uint16_t screen_height;      ///< Alto de pantalla (240)
    uint8_t avatar_scale;        ///< Escala del avatar (100 = tamaño normal)
    bool enable_animations;      ///< Habilitar animaciones
    uint32_t animation_fps;      ///< FPS para animaciones (10-30)
} ui_config_t;

/**
 * Configuración por defecto
 */
#define UI_DEFAULT_CONFIG() {       \
    .screen_width = 320,            \
    .screen_height = 240,           \
    .avatar_scale = 100,            \
    .enable_animations = true,      \
    .animation_fps = 15             \
}

/**
 * Inicializar UI LVGL
 * 
 * @param config Configuración (NULL = defaults)
 * @return ESP_OK si éxito
 */
esp_err_t ui_init(const ui_config_t *config);

/**
 * Cambiar estado visual
 * 
 * @param state Nuevo estado
 */
void ui_set_state(ui_state_t state);

/**
 * Obtener estado actual
 */
ui_state_t ui_get_state(void);

/**
 * Actualizar transcripción (texto reconocido por STT)
 * 
 * @param text Texto transcrito (NULL para limpiar)
 */
void ui_set_transcript(const char *text);

/**
 * Actualizar respuesta (texto que se está reproduciendo)
 * 
 * @param text Texto de respuesta (NULL para limpiar)
 */
void ui_set_response(const char *text);

/**
 * Actualizar nivel VU meter (durante LISTENING)
 * 
 * @param level Nivel 0-100
 */
void ui_set_vu_level(uint8_t level);

/**
 * Actualizar amplitud de audio (durante SPEAKING, para animación boca)
 * 
 * @param amplitude Amplitud 0-100
 */
void ui_set_audio_amplitude(uint8_t amplitude);

/**
 * Mostrar mensaje de error temporal
 * 
 * @param error_text Texto del error
 */
void ui_show_error(const char *error_text);

/**
 * Limpiar pantalla (volver a estado inicial)
 */
void ui_clear(void);

/**
 * Verificar si UI está inicializada
 */
bool ui_is_initialized(void);

#ifdef __cplusplus
}
#endif

#endif /* UI_LVGL_H */
