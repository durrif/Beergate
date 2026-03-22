# UI del Asistente de Voz - ESP32-S3-BOX-3

## Arquitectura

- **BSP Oficial**: `espressif/esp-box-3` v1.3.0
- **LVGL Port**: `espressif/esp_lvgl_port` v2.4.3
- **LVGL**: v8.3.11

## Compilación

### ESP-IDF (Recomendado)

```bash
idf.py set-target esp32s3
idf.py build
idf.py flash monitor
```

### PlatformIO (Limitado)

PlatformIO no ejecuta ESP-IDF Component Manager. Para usar:

1. Instalar dependencias manualmente en `components/`
2. O copiar BSP desde otro proyecto ESP-IDF

## Conversión PNG → LVGL

### Herramienta online

https://lvgl.io/tools/imageconverter

### Configuración

- **Color format**: RGB565
- **Output format**: C array
- **Tamaño**: 32x32 o 64x64 px

### Proceso

1. Subir PNG
2. Descargar `.c`
3. Reemplazar en `main/ui/assets/`
4. Mantener nombres: `cat_frame_0`, `cat_frame_1`, etc.

## Cambiar textos

Editar en `main/ui/ui.c`:

```c
static const char* state_texts[] = {
    "Di 'Oye'...",      // IDLE
    "Escuchando...",    // LISTENING
    "Pensando...",      // THINKING
    "Hablando..."       // SPEAKING
};
```

## Cambiar FPS

Editar en `main/ui/ui.c`:

```c
static const uint32_t state_fps[] = {
    2,   // IDLE
    8,   // LISTENING
    4,   // THINKING
    10   // SPEAKING
};
```

## API

```c
void ui_init(void);
void ui_set_state(ui_state_t state);
void ui_set_vu_level(float level_0_1);  // 0.0 = silencio, 1.0 = máximo
```

## Integración con audio

```c
// Desde VAD/audio callback
float rms = calcular_rms(audio_buffer);
ui_set_vu_level(rms);

// Desde máquina de estados
if (detectado_wakeword) {
    ui_set_state(UI_LISTENING);
}
```

## Troubleshooting

### Pantalla blanca

- Verificar logs: "Display inicializado"
- Comprobar BSP se inicializa correctamente
- Probar `bsp_display_brightness_set(100)`

### No compila BSP

- Usar ESP-IDF nativo, no PlatformIO
- Verificar `idf_component.yml` presente
- `idf.py reconfigure` si cambias deps

### Animación lenta

- Aumentar FPS en `state_fps[]`
- Verificar timer period en logs

## Estructura de archivos

```
main/
├── app_main_new.c         # Entry point
└── ui/
    ├── ui.h               # API pública
    ├── ui.c               # Implementación
    └── assets/
        ├── cat_0.c        # Frame IDLE
        ├── cat_1.c        # Frame LISTENING
        ├── cat_2.c        # Frame THINKING
        ├── cat_3.c        # Frame SPEAKING
        └── README.md      # Instrucciones
```
