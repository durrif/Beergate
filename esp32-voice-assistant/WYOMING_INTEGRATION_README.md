# ESP32-S3-BOX-3 Voice Assistant con Wyoming STT

Asistente de voz completo con integración de Wyoming STT, captura de audio real, VAD (Voice Activity Detection) y UI animada con LVGL.

## 🎯 Características

- ✅ **Captura de audio real**: PCM16 16kHz mono desde micrófono del BSP
- ✅ **Cliente Wyoming STT**: HTTP POST a servidor Wyoming
- ✅ **VAD (Voice Activity Detection)**: Umbral -35dB, duración mínima 200ms
- ✅ **UI animada LVGL**: Sprite de gato anime con 4 frames, VU meter de 10 barras
- ✅ **Control por botón**: Mantener presionado para grabar, soltar para enviar
- ✅ **Estados visuales**: IDLE → LISTENING → THINKING → SPEAKING → IDLE

## 📋 Requisitos

### Hardware
- ESP32-S3-BOX-3 (ESP32-S3 con LCD 320x240, touch, micrófono integrado)
- Cable USB-C para programación y depuración

### Software
- ESP-IDF v5.x (probado con 5.5.0)
- Python 3.8+
- CMake 3.16+
- Servidor Wyoming STT en red local

## 🔧 Configuración

### 1. Configurar WiFi

Edita la configuración usando `idf.py menuconfig`:

```bash
idf.py menuconfig
```

Ve a: **Example Connection Configuration** y configura:
- **WiFi SSID**: Nombre de tu red WiFi
- **WiFi Password**: Contraseña de tu red

Alternativamente, edita directamente `main/Kconfig.projbuild`:
```kconfig
config EXAMPLE_WIFI_SSID
    string "WiFi SSID"
    default "TU_WIFI_SSID"  # <-- Cambia esto

config EXAMPLE_WIFI_PASSWORD
    string "WiFi Password"
    default "TU_WIFI_PASSWORD"  # <-- Y esto
```

### 2. Configurar servidor Wyoming STT

Edita `main/wyoming_client.h` para configurar la IP del servidor:

```c
#define WYOMING_STT_HOST "192.168.30.102"  // <-- Cambia a tu IP
#define WYOMING_STT_PORT 10300
#define WYOMING_STT_PATH "/stt"
```

### 3. Configurar BSP de audio (TODO)

Actualmente `audio_capture.c` usa simulación de ruido blanco. Para integrar el micrófono real del BSP, edita las secciones marcadas con `TODO` en `main/audio_capture.c`:

```c
// TODO: Inicializar codec de audio del BSP
// Ejemplo:
// esp_codec_dev_handle_t codec_dev = bsp_audio_codec_microphone_init();
// esp_codec_dev_set_in_gain(codec_dev, 30.0);  // 30dB de ganancia
```

Consulta ejemplos en `components/esp-box/examples/` para referencia.

## 🖼️ Convertir imágenes del gato (PNG → C arrays)

El proyecto usa 4 frames animados del sprite del gato. Actualmente tiene placeholders rosados. Para usar tus propias imágenes:

### Paso 1: Preparar imágenes PNG

Crea 4 imágenes PNG (80x80px recomendado) con los frames de tu animación:
- `cat_frame_0.png` - Estado IDLE
- `cat_frame_1.png` - Parpadeando
- `cat_frame_2.png` - Boca abierta  
- `cat_frame_3.png` - Expresión alternativa

### Paso 2: Usar LVGL Image Converter

1. **Accede al convertidor online**: https://lvgl.io/tools/imageconverter

2. **Configuración recomendada**:
   - **Color format**: `RGB565` (16-bit color, compatible con BSP)
   - **Output format**: `C array`
   - **Name**: `cat_frame_0` (cambia para cada frame)

3. **Convertir cada imagen**:
   - Carga `cat_frame_0.png`
   - Configura los parámetros
   - Click en **Convert**
   - Descarga el archivo `.c` generado

### Paso 3: Reemplazar archivos

Para cada frame (0-3):

1. **Abrir archivo generado**: El convertidor genera código como:
   ```c
   const lv_img_dsc_t cat_frame_0 = {
     .header.cf = LV_IMG_CF_TRUE_COLOR,
     .header.always_zero = 0,
     .header.reserved = 0,
     .header.w = 80,
     .header.h = 80,
     .data_size = 12800,
     .data = {
       0x5A, 0xFB, 0x5A, 0xFB, ...  // Pixel data
     }
   };
   ```

2. **Extraer datos de píxeles**: Copia SOLO el contenido del array `data`:
   ```c
   0x5A, 0xFB, 0x5A, 0xFB, 0x5A, 0xFB, ...
   ```

3. **Reemplazar en `.inc` file**:
   - Abre `components/ui_assets/cat_frame_0_data.inc`
   - Reemplaza TODO el contenido con los nuevos datos
   - Asegúrate de mantener el formato (comas entre valores)

4. **Actualizar dimensiones** (si cambiaron):
   - Abre `components/ui_assets/cat_frame_0.c`
   - Actualiza `.header.w` y `.header.h` con las dimensiones reales
   - Actualiza `.data_size` = width × height × 2 bytes

### Paso 4: Recompilar

```bash
idf.py build
idf.py flash monitor
```

### Troubleshooting de imágenes

**Imagen no se muestra (negro o transparente)**:
- Verifica que `cf = LV_IMG_CF_TRUE_COLOR` (no TRUE_COLOR_ALPHA)
- Asegúrate que width/height > 0
- Revisa que el array de datos no esté vacío

**Colores incorrectos**:
- Usa RGB565 en el convertidor (16 bits por píxel)
- Orden de bytes: cada píxel son 2 bytes (MSB primero)

**Pantalla blanca o crash**:
- Verifica que `data_size` sea correcto (width × height × 2)
- Asegúrate de incluir la coma final en el array de datos
- Revisa que el array no esté truncado

## 🚀 Compilar y Flashear

```bash
# Configurar proyecto (solo primera vez o si cambias WiFi)
idf.py menuconfig

# Compilar
idf.py build

# Flashear y monitorear
idf.py flash monitor

# Solo monitorear (después de flashear)
idf.py monitor
```

## 🎮 Uso

1. **Sistema en IDLE**: Pantalla con texto "💤 En Espera", gato animado lentamente
2. **Presiona botón MAIN** (botón frontal del ESP32-S3-BOX-3)
   - Estado cambia a "🎤 Escuchando..."
   - Inicia captura de audio
   - VU meter se actualiza en tiempo real
3. **Habla al micrófono** mientras mantienes el botón presionado
4. **Suelta el botón** cuando termines de hablar
   - Estado cambia a "🤔 Pensando..."
   - Audio se procesa con VAD
   - Si hay voz detectada, se envía a Wyoming STT
5. **Resultado**:
   - Estado "🗣️ Hablando..." muestra la transcripción
   - Después de 5 segundos, vuelve a IDLE

### Condiciones para procesar audio:
- ✅ Duración mínima: 300ms
- ✅ VAD detecta voz (umbral: -35dB)
- ✅ Duración mínima de voz: 200ms

Si no se cumplen, vuelve directamente a IDLE sin procesar.

## 📁 Estructura del proyecto

```
main/
├── app_main.c          # Main con state machine y callbacks
├── ui.c / ui.h         # Interfaz LVGL con sprite y VU meter
├── audio_capture.c/h   # Captura PCM16, RMS, VAD
├── wyoming_client.c/h  # Cliente HTTP para Wyoming STT
└── Kconfig.projbuild   # Configuración WiFi

components/
├── ui_assets/          # Imágenes del sprite del gato
│   ├── cat_frame_0.c   # Frame 0 (estructura lv_img_dsc_t)
│   ├── cat_frame_0_data.inc  # Datos de píxeles RGB565
│   ├── cat_frame_1.c/inc
│   ├── cat_frame_2.c/inc
│   ├── cat_frame_3.c/inc
│   ├── ui_images.h     # Declaraciones extern
│   └── CMakeLists.txt  # Build config
├── lvgl/               # LVGL v8.3.11
├── esp_lvgl_port/      # Port de LVGL para ESP-IDF
├── esp-box-3/          # BSP oficial ESP32-S3-BOX-3
└── ...
```

## 🐛 Debugging

### Ver logs detallados:

```bash
idf.py monitor -p /dev/ttyACM0
```

**Tags de log importantes**:
- `[VOICE_ASSISTANT]` - Estado general del sistema
- `[UI]` - Eventos de interfaz
- `[AUDIO]` - Captura de audio, RMS, VAD
- `[STT]` - Cliente Wyoming, transcripciones
- `[BUTTON]` - Eventos de botón
- `[VU]` - Niveles del VU meter

### Errores comunes:

**"Failed to connect to Wyoming server"**:
- Verifica que el servidor Wyoming esté corriendo: `curl http://192.168.30.102:10300/stt`
- Revisa la IP en `wyoming_client.h`
- Confirma que el ESP32 está en la misma red WiFi

**"No voice activity detected"**:
- Aumenta el volumen al hablar
- Ajusta `VAD_DB_THRESHOLD` en `audio_capture.h` (ej: -40.0f más permisivo)
- Verifica que el micrófono BSP esté inicializado (actualmente usa simulación)

**"UI not initializing"**:
- Verifica que LVGL port esté usando versión 8 (no 9)
- Revisa `components/esp_lvgl_port/CMakeLists.txt` → debe forzar `lvgl8`

**Crash al mostrar sprite**:
- Revisa `cat_frame_X.c`: width/height > 0
- Verifica `data_size` correcto en estructuras
- Asegúrate que archivos `.inc` tengan datos válidos

## 📊 Especificaciones técnicas

### Audio:
- **Sample rate**: 16000 Hz
- **Formato**: PCM16 (16-bit signed int)
- **Canales**: Mono
- **Frame size**: 800 samples (50ms @ 16kHz)
- **Buffer máximo**: 10 segundos

### VAD:
- **Método**: RMS → dB (20 * log10)
- **Umbral**: -35.0 dB
- **Duración mínima de voz**: 200ms
- **Hysteresis**: 100ms silencio para finalizar

### Wyoming Protocol:
- **Método**: HTTP POST
- **Content-Type**: `audio/pcm;rate=16000;channels=1;bits=16`
- **Timeout**: 10 segundos
- **Respuesta**: JSON `{"text": "transcription"}`

### UI:
- **Resolución**: 320x240 (ILI9341 LCD)
- **Color depth**: RGB565 (16-bit)
- **Framerate**: Variable según estado (1-10 FPS)
- **VU meter**: 10 barras, decay 0.85, update 20Hz

## 📝 TODO / Mejoras futuras

- [ ] Integrar codec real del BSP (reemplazar simulación de audio)
- [ ] Añadir soporte TTS (Text-to-Speech) con Wyoming
- [ ] Implementar Home Assistant API para control de dispositivos
- [ ] Añadir configuración WiFi por Bluetooth
- [ ] Guardar transcripciones en NVS/SD card
- [ ] Soporte multi-idioma en UI
- [ ] Calibración automática de VAD según ruido ambiente

## 📄 Licencia

Este proyecto usa componentes con varias licencias:
- ESP-IDF: Apache License 2.0
- LVGL: MIT License  
- BSP esp-box: Apache License 2.0

## 🤝 Contribuciones

Para reportar bugs o sugerir mejoras, crea un issue describiendo:
1. Versión de ESP-IDF
2. Logs completos (`idf.py monitor`)
3. Pasos para reproducir el problema

---

**Nota**: Este proyecto está en desarrollo activo. La captura de audio actualmente usa simulación - se requiere integración con `esp_codec_dev` del BSP para funcionalidad completa.
