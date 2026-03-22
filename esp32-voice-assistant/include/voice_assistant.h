#ifndef VOICE_ASSISTANT_H
#define VOICE_ASSISTANT_H

#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

// Estados del asistente de voz
typedef enum {
    VA_STATE_IDLE = 0,        // Esperando wake word
    VA_STATE_LISTENING,       // Capturando comando tras wake word
    VA_STATE_THINKING,        // Procesando en servidor
    VA_STATE_SPEAKING,        // Reproduciendo respuesta TTS
    VA_STATE_ERROR           // Error de red u otro
} va_state_t;

// Configuración del asistente
typedef struct {
    char ha_server_url[128];      // URL servidor Wyoming/HA
    uint16_t ha_server_port;
    char wake_word[32];           // "hey jarvis", etc
    float vad_threshold_db;
    uint32_t preroll_ms;          // Pre-roll buffer (1000ms recomendado)
    uint32_t silence_timeout_ms;  // Timeout de silencio para finalizar (800ms)
    bool enable_beep;             // Beep al detectar wake word
} va_config_t;

// Callbacks para eventos
typedef void (*va_state_callback_t)(va_state_t new_state, va_state_t old_state);
typedef void (*va_transcript_callback_t)(const char *text);
typedef void (*va_error_callback_t)(const char *error_msg);

/**
 * Inicializa el asistente de voz
 */
void voice_assistant_init(const va_config_t *config);

/**
 * Registra callbacks
 */
void voice_assistant_register_callbacks(
    va_state_callback_t state_cb,
    va_transcript_callback_t transcript_cb,
    va_error_callback_t error_cb
);

/**
 * Inicia la tarea principal del asistente
 */
void voice_assistant_start(void);

/**
 * Detiene el asistente
 */
void voice_assistant_stop(void);

/**
 * Obtiene el estado actual
 */
va_state_t voice_assistant_get_state(void);

/**
 * Fuerza un cambio de estado (para debug/testing)
 */
void voice_assistant_set_state(va_state_t state);

/**
 * Convierte estado a string legible
 */
const char* voice_assistant_state_to_string(va_state_t state);

#ifdef __cplusplus
}
#endif

#endif // VOICE_ASSISTANT_H
