# 🎯 ESP32-S3-BOX Voice Assistant - Guía de Implementación

## ✅ Módulos Implementados

### 1. TTS Player (`tts_player.h/c`)
- ✅ Función `ha_tts_say(text)` - POST /tts a Home Assistant
- ✅ Parser WAV completo (RIFF/WAVE, fmt, data chunks)
- ✅ Streaming: No carga WAV completo en RAM
- ✅ Soporte PCM 16-bit mono (16kHz ideal, adaptable)
- ✅ Control de volumen con anti-clipping
- ✅ Callback de progreso para animación UI
- ✅ Manejo de timeouts y errores

### 2. UI LVGL (Pendiente de LVGL en ESP-IDF 5.5)
- ✅ Diseño completo en `ui_lvgl.h/c`
- ✅ Placeholders de gato con canvas (160x160)
- ✅ 4 estados: IDLE, LISTENING, THINKING, SPEAKING
- ✅ VU meter horizontal durante LISTENING
- ✅ Animación boca durante SPEAKING
- ⚠️ **BLOQUEADO**: ESP-IDF 5.5 no incluye LVGL por defecto

## 🚀 Flujo Completo Implementado

```
1. Usuario habla → VAD detecta voz
2. Wake word "hey jarvis" detectado → BEEP + UI: LISTENING
3. Captura 1s pre-roll + 3s comando → UI: THINKING
4. POST /stt → recibe {"text": "..."} → Muestra transcripción
5. Genera respuesta (eco por ahora) → UI: SPEAKING
6. POST /tts → recibe WAV → Reproduce + anima boca
7. Termina → UI: IDLE
```

## ⚙️ Configuración Home Assistant

### Endpoint STT/TTS

Edita en [`include/ha_client.h`](include/ha_client.h#L53):
```c
#define HA_CLIENT_DEFAULT_CONFIG() {                \
    .server_url = "http://192.168.40.50:10300",     \  // <-- CAMBIAR AQUÍ
    .timeout_ms = 15000,                            \
    ...
}
```

**Tu servidor debe exponer:**
- `POST /stt` - Content-Type: audio/pcm;rate=16000;channels=1;bits=16
  - Body: PCM16 raw
  - Response: `{"text": "transcripción"}`
- `POST /tts` - Content-Type: text/plain
  - Body: "texto a sintetizar"
  - Response: WAV file (audio/wav)

## 📝 Configuración Wyoming en Home Assistant

```yaml
# configuration.yaml
wyoming:
  whisper:
    uri: tcp://localhost:10300
  piper:
    uri: tcp://localhost:10301

# Agregar entidad de asistente
conversation:
  intents:
    TurnOnLight:
      - "enciende la luz"
      - "turn on the light"
```

O usar add-on Whisper + Piper directamente.

## 🔧 Compilación y Upload

```bash
cd /home/david/Documentos/PlatformIO/Projects/Esp32-S3-Box

# Compilar
pio run

# Upload + monitor
pio run -t upload && pio device monitor
```

## 🧪 Testing

### 1. Probar TTS directamente

Modifica `app_main()` temporalmente:
```c
// Después de tts_player_init()
tts_player_speak("Hola, sistema de voz funcionando");
```

### 2. Probar Wake Word

Habla cerca del micrófono por ~1-2 segundos. Verás:
```
🗣️  SPEECH DETECTED - Monitoring for wake word
🎯 WAKE WORD DETECTED!
🎤 Listening for command (3 seconds)...
```

### 3. Probar Flujo Completo

1. Di wake word (habla 1-2s)
2. Escucha beep de confirmación
3. Di comando: "enciende la luz"
4. Verás:
   ```
   ✅ STT Result: "enciende la luz"
   🔊 Speaking response...
   ✅ TTS playback finished
   ```

## 🎨 UI LVGL - Solución Temporal

**Problema**: ESP-IDF 5.5 no incluye LVGL por defecto.

**Opción 1: Usar ESP-IDF 4.4 (tiene LVGL)**
```bash
# En platformio.ini
platform = espressif32@5.0.0  ; ESP-IDF 4.4
```

**Opción 2: Agregar LVGL como componente externo**
```bash
cd components/
git clone --recursive https://github.com/lvgl/lvgl.git
git clone https://github.com/espressif/esp_lvgl_port.git
```

**Opción 3: Comentar UI temporalmente**

En [`src/main.c`](src/main.c), comenta:
```c
// #include "ui_lvgl.h"

// Y en app_main():
/*
if (ui_init(&ui_cfg) == ESP_OK) {
    ...
}
*/
```

## 📊 Logs Esperados

```
I (2340) ESP32-S3-BOX: 🚀 Iniciando ESP32-S3-BOX...
I (2450) ESP32-S3-BOX: ✅ WiFi connected! IP: 192.168.40.54
I (2680) ESP32-S3-BOX: ✅ Audio system ready
I (2690) HA_CLIENT: Home Assistant Wyoming client initialized
I (2710) TTS_PLAYER: TTS Player initialized
I (2720) ESP32-S3-BOX: 🎤 Audio processing task started

[Hablando 1-2s...]
I (15230) ESP32-S3-BOX: 🗣️  SPEECH DETECTED
I (16450) WAKEWORD: 🎯 WAKE WORD DETECTED! (placeholder)
I (16460) ESP32-S3-BOX: 🎤 Listening for command (3 seconds)...
I (19670) ESP32-S3-BOX: 🚀 Sending 128000 bytes to Home Assistant...
I (20340) HA_CLIENT: ✅ Transcribed: "enciende la luz"
I (20350) TTS_PLAYER: 🔊 TTS Say: "Escuché: enciende la luz"
I (21120) TTS_PLAYER: ✅ Received 45678 bytes of WAV
I (21180) TTS_PLAYER: WAV format: 22050 Hz, 1 ch, 16 bits
I (21190) TTS_PLAYER: 🎵 Playing WAV: 2150 ms
I (23390) TTS_PLAYER: ✅ Playback finished
```

## 🔍 Troubleshooting

### Error: "Failed to get TTS audio"
- Verifica que Home Assistant esté accesible
- Prueba: `curl -X POST http://192.168.40.50:10300/tts -d "hola"`
- Verifica timeout (aumentar `timeout_ms`)

### Error: "Unsupported WAV format"
- TTS debe generar PCM 16-bit mono
- Sample rate soportado: 16000, 22050, 24000, 44100 Hz

### No detecta wake word
- Habla más fuerte o más cerca del micrófono
- Ajusta umbrales en `wakeword.c`:
  ```c
  #define WAKEWORD_MIN_ENERGY_DB -35.0f  // Reducir a -40 para más sensibilidad
  ```

### Audio entrecortado
- Aumenta `chunk_size` en tts_player_config
- Verifica que no haya drops I2S en logs

## 📁 Estructura del Proyecto

```
Esp32-S3-Box/
├── include/
│   ├── board_pins.h         - Pines hardware
│   ├── audio_hal.h          - Driver I2S
│   ├── vad.h                - Voice Activity Detection
│   ├── audio_buffer.h       - Buffer circular
│   ├── wakeword.h           - Detector wake word
│   ├── ha_client.h          - Cliente HTTP Wyoming
│   ├── tts_player.h         - ✅ Reproductor TTS
│   └── ui_lvgl.h            - ⚠️ UI (necesita LVGL)
├── src/
│   ├── main.c               - ✅ Flujo completo integrado
│   ├── audio_hal.c
│   ├── vad.c
│   ├── audio_buffer.c
│   ├── wakeword.c
│   ├── ha_client.c
│   ├── tts_player.c         - ✅ Parser WAV + streaming
│   └── ui_lvgl.c            - ⚠️ Placeholders (bloqueado)
└── assets/
    └── README.md            - Guía sprites gato
```

## 🎯 Próximos Pasos

1. **Resolver LVGL**: Usar ESP-IDF 4.4 o agregar como componente
2. **Integrar intent processing**: Enviar comando a Home Assistant
3. **Agregar sprites reales del gato** (ver assets/README.md)
4. **Optimizar wake word**: Integrar ESP-SR para "Hey Jarvis" real
5. **Agregar botones**: Mute, volumen, reset

## 📞 Endpoints a Cambiar

1. **IP Home Assistant**: `include/ha_client.h` línea 53
2. **Endpoints**: Por defecto `/stt` y `/tts`
3. **Timeout**: Aumentar si red lenta (línea 54)

¡Todo listo para probar el flujo de voz completo! 🎉
