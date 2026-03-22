#pragma once

#include "esp_err.h"

typedef enum {
    UI_STATE_IDLE,       // En espera
    UI_STATE_LISTENING,  // Escuchando...
    UI_STATE_THINKING,   // Pensando...
    UI_STATE_SPEAKING    // Hablando...
} ui_state_t;

/**
 * @brief Inicializa la interfaz gráfica con BSP oficial
 * 
 * Debe llamarse después de bsp_display_start()
 */
esp_err_t ui_init(void);

/**
 * @brief Cambia el estado visual de la UI
 * @param state New state
 * @param text Optional text for transcription/response (NULL for default)
 */
void ui_set_state(ui_state_t state, const char *text);

/**
 * @brief Actualiza las barras VU con nivel de audio
 * 
 * @param level_0_1 Nivel normalizado 0.0 a 1.0
 */
void ui_set_vu_level(float level_0_1);

/**
 * @brief Obtiene el estado actual
 */
ui_state_t ui_get_state(void);
