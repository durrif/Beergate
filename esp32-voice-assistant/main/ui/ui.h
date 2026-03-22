#pragma once

#include "esp_err.h"

typedef enum {
    UI_IDLE,
    UI_LISTENING,
    UI_THINKING,
    UI_SPEAKING
} ui_state_t;

void ui_init(void);
void ui_set_state(ui_state_t state);
void ui_set_vu_level(float level_0_1);
