# ESP32-S3-BOX Voice Satellite para Home Assistant

Asistente de voz local que funciona como satellite de Home Assistant usando Wyoming Protocol.

## Hardware
- **ESP32-S3-BOX** (ESP32-S3 + LCD 320x240 + Touch)
- **Micrófono**: ES7210 (4-channel ADC, I2S)
- **Altavoz**: ES8311 (Audio Codec, I2S)
- **Pantalla**: ILI9342C

## Arquitectura

```
┌─────────────────────────────────────────────────┐
│          ESP32-S3-BOX (Voice Satellite)         │
├─────────────────────────────────────────────────┤
│ 1. IDLE: Escucha wake word ("Hey Jarvis")      │
│ 2. LISTENING: Captura audio + VAD               │
│ 3. THINKING: Envía a Wyoming/Whisper (STT)     │
│ 4. SPEAKING: Reproduce TTS desde Piper          │
└─────────────────────────────────────────────────┘
                    │
                    ▼ (Wyoming Protocol sobre HTTP)
┌─────────────────────────────────────────────────┐
│          Home Assistant + Wyoming                │
├─────────────────────────────────────────────────┤
│ - Wyoming-Whisper (STT)                         │
│ - Wyoming-Piper (TTS)                           │
│ - Intent Recognition                            │
└─────────────────────────────────────────────────┘
```

## Componentes Implementados

### ✅ Completados
- **audio_hal**: Driver I2S para ES7210 (mic) + ES8311 (speaker)
- **vad**: Voice Activity Detection (energía + ZCR)
- **audio_buffer**: Buffer circular para pre-roll de 1 segundo
- **WiFi**: Conexión automática con reintentos

### 🚧 En Desarrollo
- **wake_word**: Detección de palabra clave
- **ha_client**: Cliente HTTP para Wyoming Protocol
- **tts_playback**: Reproducción de audio TTS
- **ui**: Interfaz LVGL con estados y VU meter

## Configuración

### 1. WiFi
Editar en `src/main.c`:
```c
#define WIFI_SSID      "TuRed"
#define WIFI_PASS      "TuPassword"
```

### 2. Servidor Home Assistant
Editar en `src/voice_assistant.c` (cuando esté implementado):
```c
va_config_t config = {
    .ha_server_url = "http://192.168.1.100:10300",  // Wyoming-Whisper
    .ha_server_port = 10300,
    .wake_word = "hey jarvis",
    .vad_threshold_db = -40.0f,
    .preroll_ms = 1000,
    .silence_timeout_ms = 800,
    .enable_beep = true
};
```

### 3. Umbrales VAD
En `include/vad.h`:
```c
#define VAD_ENERGY_THRESHOLD    -40.0f  // Ajustar según ruido
#define VAD_ZCR_THRESHOLD       0.3f
#define VAD_SILENCE_FRAMES      20      // 400ms de silencio
```

## Compilación

```bash
cd /path/to/Esp32-S3-Box
platformio run -t upload
platformio device monitor --baud 115200
```

## Wake Word Detection

### Opción 1: ESP-SR (Recomendado para producción)
ESP-SR es el framework oficial de Espressif para reconocimiento de voz.

**Instalación:**
```bash
cd components
git clone --recursive https://github.com/espressif/esp-sr.git
```

**Configuración en `platformio.ini`:**
```ini
board_build.esp-idf.sdkconfig_path = sdkconfig.esp32s3box

# En sdkconfig.esp32s3box agregar:
# CONFIG_SR_MODEL_WN9_HILEXIN=y
# CONFIG_SR_MODEL_WN9_XIAOAITONGXUE=y  # "小爱同学"
```

**Uso:**
```c
#include "esp_wn_iface.h"
#include "esp_wn_models.h"

// Modelos disponibles:
// - WN9_HILEXIN: "Hi Lexin"
// - WN9_XIAOAITONGXUE: "小爱同学" (Xiao Ai Tong Xue)
// - WN9_NIHAOXIAOZHI: "你好小智" (Ni Hao Xiao Zhi)
```

**Limitación**: Los modelos pre-entrenados están en chino/inglés limitado.

### Opción 2: Wake Word Custom (Placeholder actual)
Por ahora está implementado un placeholder que simula detección cada N segundos para pruebas.

**Para implementar tu propio wake word:**
1. Entrenar modelo con [Porcupine](https://github.com/Picovoice/porcupine) o similar
2. Exportar a formato ESP32
3. Integrar en `src/wake_word.c`

## Flujo de Funcionamiento

```
1. IDLE
   ↓ (wake word detectado)
2. LISTENING
   - Beep corto
   - Buffer pre-roll activo
   - VAD controla inicio/fin de frase
   ↓ (silencio de 800ms)
3. THINKING
   - Envía audio PCM16 a Wyoming-Whisper
   - Espera transcripción
   ↓ (recibe texto + respuesta TTS)
4. SPEAKING
   - Reproduce audio desde Piper
   - UI muestra texto
   ↓ (fin de reproducción)
1. IDLE (vuelta al inicio)
```

## Logs de Debug

```bash
# Nivel de audio
I (12345) ESP32-S3-BOX: 🎵 Audio level: -27.1 dB (RMS: 1448)

# VAD
I (12346) VAD: 🗣️  SPEECH START (energy=-25.3 dB, zcr=0.451)
I (14567) VAD: 🤫 SPEECH STOP (silence for 20 frames / 0.4 s)

# Estados
I (14568) VOICE_ASST: State: IDLE → LISTENING
I (15678) VOICE_ASST: State: LISTENING → THINKING
I (16789) VOICE_ASST: State: THINKING → SPEAKING
```

## API Principal

### VAD
```c
vad_context_t vad_ctx;
vad_init(&vad_ctx);

int16_t frame[320];  // 20ms @ 16kHz
vad_state_t state = vad_process_frame(&vad_ctx, frame, 320);
if (state == VAD_SPEECH) {
    // Hay voz
}
```

### Audio Buffer
```c
audio_buffer_t *buf = audio_buffer_create(1000, 16000);  // 1 segundo
audio_buffer_write(buf, samples, n);

// Al detectar wake word:
int16_t *preroll;
size_t preroll_len = audio_buffer_get_all(buf, &preroll);
// Enviar preroll + audio posterior al servidor
```

### Voice Assistant
```c
va_config_t config = { /* ... */ };
voice_assistant_init(&config);

void on_state_change(va_state_t new_state, va_state_t old_state) {
    printf("State: %s → %s\n", 
           voice_assistant_state_to_string(old_state),
           voice_assistant_state_to_string(new_state));
}

voice_assistant_register_callbacks(on_state_change, NULL, NULL);
voice_assistant_start();
```

## Troubleshooting

### No detecta voz
- Verifica niveles de audio en logs: `🎵 Audio level: X dB`
- Ajusta `VAD_ENERGY_THRESHOLD` en `include/vad.h`
- Comprueba que el micrófono esté activo: habla cerca del dispositivo

### Wake word no funciona
- Placeholder actual: se activa cada 30s para testing
- Para producción: implementar ESP-SR o alternativa

### No conecta a Home Assistant
- Verifica que Wyoming-Whisper esté corriendo: `curl http://IP:10300/info`
- Comprueba firewall/VLAN (debe permitir HTTP desde IoT VLAN)
- Revisa logs de red en `ha_client.c`

### Audio cortado/robótico
- Aumenta tamaño de buffer en `audio_playback.c`
- Verifica latencia de red con `ping 192.168.X.X`
- Comprueba que no haya otros procesos bloqueando I2S

## Performance

- **Latencia wake-to-response**: ~2-3 segundos (depende de red + HA)
- **Uso de RAM**: ~120KB (buffers de audio)
- **CPU**: ~15% en IDLE, ~40% durante procesamiento
- **Consumo**: ~200mA @ 5V (pantalla apagada), ~350mA (pantalla on)

## Próximos Pasos

1. ✅ VAD implementado
2. ⏳ Integrar ESP-SR para wake word real
3. ⏳ Cliente HTTP Wyoming completo
4. ⏳ UI con LVGL (estados + VU meter)
5. ⏳ Reproducción TTS
6. ⏳ Gestos táctiles (mute, ajuste volumen)
7. ⏳ Modo offline con comandos locales

## Referencias

- [Wyoming Protocol](https://github.com/rhasspy/wyoming)
- [ESP-SR Framework](https://github.com/espressif/esp-sr)
- [Home Assistant Voice](https://www.home-assistant.io/voice_control/)
- [ESP32-S3-BOX Datasheet](https://www.espressif.com/en/products/devkits/esp32-s3-box)

## Licencia

MIT
