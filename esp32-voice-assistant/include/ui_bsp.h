/**
 * @file ui_bsp.h
 * @brief Header para UI usando BSP oficial esp-box-3
 */

#ifndef UI_BSP_H
#define UI_BSP_H

#include "esp_err.h"
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

// Estados de la UI del asistente de voz
typedef enum {
    UI_STATE_IDLE,      // Esperando comando
    UI_STATE_LISTENING, // Escuchando voz del usuario
    UI_STATE_THINKING,  // Procesando en servidor
    UI_STATE_SPEAKING,  // Reproduciendo respuesta
    UI_STATE_ERROR      // Error en el proceso
} ui_state_t;

// Configuración de UI (para futura expansión)
typedef struct {
    uint8_t backlight_percent;
    bool enable_animations;
} ui_config_t;

#define UI_DEFAULT_CONFIG() { \
    .backlight_percent = 100, \
    .enable_animations = true \
}

/**
 * @brief Inicializa la UI usando BSP oficial
 * 
 * Esta función:
 * - Inicializa el BSP de Espressif
 * - Configura LVGL
 * - Crea la interfaz del gato anime
 * - Configura backlight
 * 
 * @param config Configuración de UI (puede ser NULL para defaults)
 * @return ESP_OK si exitoso
 */
esp_err_t ui_init(const ui_config_t *config);

/**
 * @brief Cambia el estado visual de la UI
 * 
 * Actualiza la pantalla para mostrar el estado actual:
 * - IDLE: Gato sonriente con "¡Hola!"
 * - LISTENING: Animación + "Escuchando..."
 * - THINKING: Gato pensativo + "Pensando..."
 * - SPEAKING: Gato hablando + "Hablando..."
 * - ERROR: Gato triste + "Error"
 * 
 * @param new_state Nuevo estado a mostrar
 * @return ESP_OK si exitoso
 */
esp_err_t ui_set_state(ui_state_t new_state);

/**
 * @brief Obtiene el estado actual de la UI
 * 
 * @return Estado actual
 */
ui_state_t ui_get_state(void);

// ============================================================================
// FUNCIONES AUXILIARES (STUBS TEMPORALES)
// ============================================================================

/**
 * @brief Verifica si la UI está inicializada
 * @return true si inicializada
 */
bool ui_is_initialized(void);

/**
 * @brief Actualiza amplitud de audio (para animaciones futuras)
 * @param amplitude Amplitud 0-255
 */
void ui_set_audio_amplitude(uint8_t amplitude);

/**
 * @brief Actualiza nivel VU (para barras de audio futuras)
 * @param level Nivel 0-100
 */
void ui_set_vu_level(uint8_t level);

/**
 * @brief Muestra transcripción en pantalla
 * @param text Texto a mostrar
 */
void ui_set_transcript(const char *text);

/**
 * @brief Muestra respuesta del asistente
 * @param text Texto de respuesta
 */
void ui_set_response(const char *text);

/**
 * @brief Limpia la pantalla
 */
void ui_clear(void);

/**
 * @brief Muestra mensaje de error
 * @param error_msg Mensaje de error
 */
void ui_show_error(const char *error_msg);

#ifdef __cplusplus
}
#endif

#endif // UI_BSP_H
