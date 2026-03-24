# Beergate Voice Assistant — ESP32-S3-Box-3 — Estado Completo del Proyecto

## ARQUITECTURA
ESP32-S3-Box-3 (VLAN 40) → Voice Gateway en CT 103 (192.168.30.102) → Beergate API en CT 102 (192.168.30.101)

El ESP32 graba audio, lo envía al Gateway como WAV multipart. El Gateway hace STT (Whisper), busca wake word "cervecero", envía el comando a Beergate API, genera TTS (Piper), y devuelve WAV al ESP32 que lo reproduce por el speaker.

## SERVIDORES
- **CT 102** (192.168.30.101): docker-edge-apps, Beergate production, 6 containers Docker. El código fuente del ESP32 está en `/opt/beergate/simple-backend/beergate-v2/esp32/existing-project/`. PlatformIO instalado: `source ~/.platformio/penv/bin/activate`
- **CT 103** (192.168.30.102): voice-ai, Gateway + Whisper + Piper. SSH: `root@192.168.30.102` password `4431Durr$`
  - Gateway: `/opt/voice-ai/gateway/` (main.py, Dockerfile, docker-compose.yml, requirements.txt)
  - Gateway port 8000, Whisper port 10300, Piper port 10200
  - Piper voice: `es_ES-davefx-medium`
- **ESP32-S3-Box-3**: IP 192.168.40.78 (VLAN 40), conectado por USB a la máquina local

## ESTADO ACTUAL — QUÉ FUNCIONA Y QUÉ NO

### ✅ Funciona:
- Pipeline completo: botón → graba → gateway → Whisper STT → Beergate API → Piper TTS → devuelve WAV → reproduce
- Wake word fuzzy matching (cervecero, fervecero, cerveza, etc.)
- PSRAM habilitado (CONFIG_SPIRAM=y, OCT mode)
- Mic pause/resume durante playback del speaker
- 5s buffer de audio, 3s silence timeout
- Gateway acaba de ser actualizado con:
  - Resampling FIR anti-aliasing (Blackman-windowed sinc 256 taps + linear interp) en vez de FFT crudo
  - Respuesta limitada a 300 chars para evitar TTS enormes
  - Voice davefx-medium

### ⚠️ Problema actual:
- La firmware fue compilada en CT 102 y se intentó copiar y flashear localmente, pero el ESP32 no bootea tras el flash
- El audio TTS se oye MUY MAL — metálico, robótico, chirriante. Esto es lo que estamos arreglando.
- El gateway ya tiene los fixes de audio desplegados, pero la firmware del ESP32 aún tiene el buffer viejo de 512KB (debería ser 1MB)

### Cambios pendientes en la firmware (ya están en el código fuente en CT 102, solo falta compilar y flashear):
1. `MAX_RESPONSE_SIZE` cambiado de 512KB a 1MB en `wyoming_client.c`
2. 500ms delay post-speaker antes de resumir mic en `wyoming_client.c`
3. `[platformio] src_dir = main` añadido a `platformio.ini`
4. Build flags limpiados (quitados `-DCONFIG_ESP32S3_DEFAULT_CPU_FREQ_240=y` y `-DCONFIG_SPIRAM_SPEED_80M=y`, añadido `-Wno-error`)

## QUÉ NECESITO QUE HAGAS

### Paso 1: Sincronizar código fuente
Copia los archivos fuente actualizados desde CT 102 al proyecto local del ESP32. Los archivos clave están en CT 102 en `/opt/beergate/simple-backend/beergate-v2/esp32/existing-project/main/`:
- `app_main.c`
- `audio_capture.c`
- `audio_capture.h`
- `wyoming_client.c`
- `wyoming_client.h`

Y también:
- `platformio.ini` (tiene `[platformio] src_dir = main` y flags limpios)
- `sdkconfig.esp32s3box`
- `sdkconfig.defaults`
- `sdkconfig`
- `partitions.csv`

Usa SCP: `scp david@192.168.30.101:/opt/beergate/simple-backend/beergate-v2/esp32/existing-project/main/{app_main.c,audio_capture.c,audio_capture.h,wyoming_client.c,wyoming_client.h} ./main/`

Y: `scp david@192.168.30.101:/opt/beergate/simple-backend/beergate-v2/esp32/existing-project/{platformio.ini,sdkconfig.esp32s3box,sdkconfig.defaults,sdkconfig,partitions.csv} ./`

### Paso 2: Compilar localmente

source ~/.platformio/penv/bin/activate
cd [directorio local del proyecto ESP32]
pio run -e esp32s3box


Si falla con "Couldn't find main target", asegúrate de que `platformio.ini` tiene `[platformio]\nsrc_dir = main` al principio.Si falla con warnings tratados como errores (macro-redefined), asegúrate de que build_flags tiene `-Wno-error`.### 

Paso 3: Flashear
pio run -e esp32s3box -t upload --upload-port /dev/ttyACM2

(El puerto puede ser ttyACM1 o ttyACM2, comprueba con `ls /dev/ttyACM*`)

Si falla, pon en modo boot: mantén BOOT + pulsa RESET, suelta RESET, suelta BOOT.

### Paso 4: Monitor y verificación

pio device monitor -b 115200 -p /dev/ttyACMX


Verifica estos mensajes:
- `ESP32-S3-BOX-3 Voice Assistant`
- `WiFi connected` con IP 192.168.40.x
- `Gateway health OK` (el gateway está en 192.168.30.102:8000)
- `System READY`
- `Buffer: 80000 samples (5.0s)`

### Paso 5: Test con botón
Mantén presionado el botón principal, di "cervecero, ¿cuánta malta hay?", suelta. Verifica:
- `Gateway response: HTTP 200, XXXXX bytes`
- `WAV: 16000Hz 1ch 16bit`
- `Playback done: X bytes`
- NO debería haber "Response buffer full" (el buffer ahora es 1MB)

### Paso 6: Reporta
- IP del dispositivo
- Tamaño de respuesta del gateway (bytes)
- Si hubo buffer full warning
- Cómo suena el audio (¿sigue metálico o mejoró?)
- Logs completos del ciclo botón→respuesta

## ARCHIVOS CLAVE Y SU CONTENIDO ACTUAL

### wyoming_client.h (en CT 102)
```c
#define GATEWAY_HOST     "192.168.30.102"
#define GATEWAY_PORT     8000
#define GATEWAY_TIMEOUT_MS 30000

/opt/beergate/simple-backend/beergate-v2/esp32/existing-project/platformio.ini

[platformio]
src_dir = main

[env:esp32s3box]
platform = espressif32
board = esp32s3box
framework = espidf
monitor_speed = 115200
monitor_filters = esp32_exception_decoder
build_flags = 
    -DBOARD_HAS_PSRAM
    -DCONFIG_BSP_BOARD_ESP32_S3_BOX_3=1
    -DLVGL_BUFFER_HEIGHT=30
    -Wno-error
board_build.flash_mode = dio
board_build.partitions = partitions.csv
board_build.psram_mode = octal
board_build.arduino.memory_type = qio_opi
board_build.esp-idf.sdkconfig_path = sdkconfig.esp32s3box

CREDENCIALES
CT 102 SSH: david@192.168.30.101 (usuario normal Linux)
CT 103 SSH: root@192.168.30.102 password 4431Durr$
Beergate API auth: admin@beergate.es / beergate2025!
WiFi ESP32: SSID Casa_HS_Wifi password ErizoDespenado22 (VLAN 40)
IMPORTANTE
El gateway en CT 103 YA está actualizado y funcionando (health OK)
Solo necesitas sincronizar el código fuente, compilar localmente, flashear y verificar
Si el audio sigue sonando mal después del flash, el problema está en el gateway o en el speaker codec del ESP32
NO modifiques el gateway (main.py en CT 103) — eso ya está hecho




