# Guía de UI - ESP32-S3-BOX-3 Voice Assistant

## Arquitectura de UI

### Estados del Sistema

El asistente de voz implementa una máquina de estados con 4 estados:

```
IDLE → LISTENING → THINKING → SPEAKING → IDLE
  ↑_______________________________________|
```

**Flujo de estados:**

1. **IDLE (En Espera)**
   - Estado inicial
   - VU meter en mínimo nivel
   - Sprite del gato rosa pálido, animación lenta

2. **LISTENING (Escuchando)**
   - Activo al presionar botón físico frontal (BUTTON_PRESS_DOWN)
   - Captura de audio iniciada
   - VU meter muestra nivel de entrada
   - Sprite del gato en verde/cyan, animación rápida

3. **THINKING (Procesando)**
   - Activo al soltar botón (BUTTON_PRESS_UP) si:
     - Duración de captura > 300ms
     - VAD detecta actividad de voz
   - Audio enviado a Home Assistant STT
   - VU meter nivel medio
   - Sprite del gato en azul, pulsando

4. **SPEAKING (Respondiendo)**
   - Activo cuando STT termina y TTS inicia
   - Reproducción de respuesta de Home Assistant
   - VU meter sincronizado con audio
   - Sprite del gato en rosa brillante, boca animada

### Control por Botón

**Callbacks registrados:**
- `BUTTON_PRESS_DOWN`: Inicia captura → `ui_set_state(LISTENING)`
- `BUTTON_PRESS_UP`: Detiene captura, evalúa audio:
  - Si < 300ms o silencio → `IDLE`
  - Si voz detectada → `THINKING` → (STT) → `SPEAKING` → `IDLE`

**Funciones de audio (stubs implementados):**
- `start_audio_capture()` - Inicia grabación
- `stop_audio_capture()` - Detiene y ejecuta VAD simple
- `ha_stt_send()` - Envía audio a Home Assistant (simulado)
- `ha_tts_request()` - Solicita y reproduce TTS (simulado)

## Sprite del Gato

### Implementación Actual (LVGL Objetos)

El sprite del gato se compone de objetos LVGL nativos:
- **Círculo base**: `lv_obj` 80x80px, color cambia según estado
- **Ojos**: 2 círculos negros 8x8px
- **Boca**: Rectángulo negro 16x4px

**Animación:** Timer de 120ms (8 FPS) mueve ojos ±2px y boca ±3px, creando efecto de "respiración"

### Conversión de Imágenes PNG a LVGL (Método Alternativo)

Si deseas usar imágenes PNG reales en lugar de objetos:

#### Paso 1: Preparar Imagen

1. Crear PNG 40x40px con fondo transparente
2. Diseñar 4 frames del gato:
   - `cat_0.png` - Ojos abiertos
   - `cat_1.png` - Ojos semicerrados
   - `cat_2.png` - Ojos cerrados (parpadeo)
   - `cat_3.png` - Ojos semicerrados

#### Paso 2: Conversión con LVGL Image Converter

**Herramienta online:** https://lvgl.io/tools/imageconverter

**Configuración:**
```
- Color format: CF_TRUE_COLOR_ALPHA (RGB565A8)
- Output format: C array
- Name: cat_0, cat_1, cat_2, cat_3
- Binary format: Little Endian (para ESP32)
```

**¿Por qué RGB565A8?**
- **RGB565**: 16-bit color (5 bits R, 6 bits G, 5 bits B) - óptimo para LCD de 16bpp
- **A8**: Canal alpha de 8 bits para transparencia
- **Ventaja**: Menor uso de memoria que RGB888 (50% menos)
- **Compatible**: LVGL v8.3.11 en ESP32-S3

#### Paso 3: Integrar Archivos C

1. El converter genera archivos `.c` con:
```c
const lv_img_dsc_t cat_0 = {
  .header.cf = LV_IMG_CF_TRUE_COLOR_ALPHA,
  .header.w = 40,
  .header.h = 40,
  .data_size = 3200,  // 40*40*2 bytes RGB565
  .data = cat_0_map,
};
```

2. Copiar archivos a `main/`:
```
main/
├── cat_0.c
├── cat_1.c
├── cat_2.c
├── cat_3.c
└── cat_frames.h
```

3. Crear header `cat_frames.h`:
```c
#ifndef CAT_FRAMES_H
#define CAT_FRAMES_H

#include "lvgl.h"

extern const lv_img_dsc_t cat_0;
extern const lv_img_dsc_t cat_1;
extern const lv_img_dsc_t cat_2;
extern const lv_img_dsc_t cat_3;

#endif
```

4. Añadir a `CMakeLists.txt`:
```cmake
idf_component_register(SRCS 
    "app_main.c"
    "cat_0.c"
    "cat_1.c"
    "cat_2.c"
    "cat_3.c"
    # ... otros archivos
```

#### Paso 4: Uso en Código

Reemplazar la creación del sprite en `ui_init()`:

```c
// Cambiar de lv_obj_create a lv_img_create
ui_ctx.cat_sprite = lv_img_create(ui_ctx.screen);
lv_img_set_src(ui_ctx.cat_sprite, &cat_0);  // Frame inicial
lv_obj_align(ui_ctx.cat_sprite, LV_ALIGN_TOP_MID, 0, 30);
lv_img_set_zoom(ui_ctx.cat_sprite, 512);  // 2x zoom (40px -> 80px)
```

Modificar `cat_animation_timer_cb()`:

```c
static void cat_animation_timer_cb(lv_timer_t *timer)
{
    if (!ui_ctx.initialized || !ui_ctx.cat_sprite) return;
    
    lvgl_port_lock(0);
    
    // Cambiar frame
    ui_ctx.cat_frame = (ui_ctx.cat_frame + 1) % 4;
    
    // Aplicar imagen según frame
    const lv_img_dsc_t* frames[] = {&cat_0, &cat_1, &cat_2, &cat_3};
    lv_img_set_src(ui_ctx.cat_sprite, frames[ui_ctx.cat_frame]);
    
    lvgl_port_unlock();
}
```

## VU Meter

**Componentes:**
- 10 barras verticales (20x3px inicial)
- Color: Verde neón (#00e676)
- Animación suave con interpolación exponencial
- Altura dinámica: 3-40px según nivel de audio

**API:**
```c
void ui_set_vu_level(float level);  // level: 0.0-1.0
```

**Comportamiento:**
- `level=0.0`: Barras mínimas (3px)
- `level=1.0`: Barras máximas (40px)
- Interpolación: `lerp = 0.3` para efecto "elástico"

## Configuración LVGL

**Archivo:** `components/lvgl/lv_conf.h`

```c
#define LV_COLOR_DEPTH 16          // RGB565
#define LV_COLOR_16_SWAP 0         // No swap (Little Endian)
#define LV_MEM_SIZE (48U * 1024U)  // 48KB heap
#define LV_DISP_DEF_REFR_PERIOD 30 // 33 FPS
```

## Debugging

**Logs de estado:**
```
I (1234) VOICE_UI: [BUTTON] PRESIONADO
I (1234) VOICE_UI: [STATE] IDLE -> LISTENING
I (1234) VOICE_UI: [AUDIO] Iniciando captura...
I (2500) VOICE_UI: [BUTTON] SOLTADO
I (2500) VOICE_UI: [AUDIO] Captura detenida: 1266 ms, VAD=VOZ
I (2500) VOICE_UI: [STATE] LISTENING -> THINKING
I (2500) VOICE_UI: [STT] Enviando audio a Home Assistant...
I (4500) VOICE_UI: [STT] Transcripción recibida: 'enciende la luz'
I (4500) VOICE_UI: [STATE] THINKING -> SPEAKING
I (4500) VOICE_UI: [TTS] Solicitando respuesta TTS...
I (7500) VOICE_UI: [TTS] Reproducción completada
I (7500) VOICE_UI: [STATE] SPEAKING -> IDLE
```

**Verificar estados:**
- Monitor serial: `idf.py monitor`
- Filtrar logs: `idf.py monitor | grep STATE`

## Estructura de Archivos

```
Esp32-S3-Box/
├── main/
│   ├── app_main.c          # Lógica principal + máquina de estados
│   ├── CMakeLists.txt      # Build config
│   ├── cat_*.c             # (Opcional) Frames del gato en C
│   └── cat_frames.h        # (Opcional) Headers de imágenes
├── components/
│   ├── lvgl/               # LVGL v8.3.11
│   ├── esp_lvgl_port/      # Port oficial ESP-IDF
│   └── esp-box-3/          # BSP oficial ESP32-S3-BOX-3
├── CMakeLists.txt          # Proyecto ESP-IDF
├── sdkconfig               # Configuración ESP-IDF
└── README_UI.md            # Este archivo
```

## Performance

**Benchmarks (ESP32-S3 @ 160MHz):**
- Refresh rate: 30 FPS (33ms period)
- LVGL task: ~15% CPU
- RAM usage: ~120KB (LVGL + buffers)
- Flash: ~540KB (firmware completo)

**Optimizaciones:**
- DMA para SPI (ILI9341)
- Double buffering (2x buffers de 10 líneas)
- PSRAM para LVGL heap
- RGB565 reduce memoria 50% vs RGB888

## Referencias

- **LVGL Docs**: https://docs.lvgl.io/8.3/
- **ESP-IDF**: https://docs.espressif.com/projects/esp-idf/en/v5.5/
- **BSP esp-box-3**: https://github.com/espressif/esp-bsp/tree/master/bsp/esp-box-3
- **Image Converter**: https://lvgl.io/tools/imageconverter
- **Color Picker RGB565**: https://chrishewett.com/blog/true-rgb565-colour-picker/

## Troubleshooting

**Problema: Sprite no se ve**
- Verificar `LV_COLOR_DEPTH == 16` en lv_conf.h
- Confirmar formato RGB565A8 en image converter
- Revisar que alpha != 0x00 (transparente total)

**Problema: VU meter no anima**
- Verificar timer activo: `ui_ctx.anim_timer != NULL`
- Confirmar `lvgl_port_lock()` antes de modificar objetos

**Problema: Botón no responde**
- Confirmar GPIO 1 (BSP_BUTTON_MAIN_IO) en esp-box-3
- Verificar callbacks registrados con `iot_button_register_cb()`
- Log: Buscar `[BUTTON] PRESIONADO/SOLTADO`

**Problema: Estados se quedan fijos**
- Verificar que STT/TTS tasks llaman `ui_set_state()` al terminar
- Revisar logs `[STATE] X -> Y` en monitor

---

**Versión:** 1.0  
**Fecha:** Febrero 2026  
**Hardware:** ESP32-S3-BOX-3  
**Firmware:** ESP-IDF 5.5.0 + LVGL 8.3.11
