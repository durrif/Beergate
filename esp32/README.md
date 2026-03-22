# ESP32-S3-Box — Beergate Voice Client

## Architecture

```
ESP32-S3-Box  →  Voice Gateway (CT103:8000)  →  Beergate API (CT102:8080)
  [mic/speaker]     ├─ Whisper STT (:10300)
                    └─ Piper TTS   (:10200)
```

## Setup

### 1. Install PlatformIO

```bash
pip install platformio
```

### 2. Configure WiFi

Edit `src/main.cpp` and set:
```cpp
static const char *WIFI_SSID = "YOUR_WIFI_SSID";
static const char *WIFI_PASS = "YOUR_WIFI_PASSWORD";
```

### 3. Flash

Connect the ESP32-S3-Box via USB and run:
```bash
cd platformio
pio run -t upload
```

### 4. Monitor

```bash
pio device monitor
```

## Usage

1. The ESP32 connects to WiFi and checks gateway health
2. Press the **BOOT button** (GPIO0) to start recording
3. Speak your command (e.g., "Cuánta malta tengo en inventario")
4. Release the button (or wait 5 seconds)
5. The response will play through the speaker

## Voice Commands (Spanish)

| Command | Example |
|---------|---------|
| Navigate | "Ir a inventario", "Ir a recetas" |
| Search | "Buscar Cascade", "Buscar levadura" |
| Add stock | "Añadir 2 kilos de malta pilsen" |
| Query stock | "Cuánta malta tengo" |
| List inventory | "Qué tengo en inventario" |
| Low stock | "Ingredientes con stock bajo" |
| Timer | "Iniciar temporizador de 60 minutos" |
| Temperature | "Temperatura a 68 grados" |
| Start brew | "Iniciar elaboración" |

## Pin Mapping (ESP32-S3-Box)

| Function | GPIO |
|----------|------|
| I2S BCLK | 17 |
| I2S WS | 45 |
| I2S DIN (mic) | 16 |
| I2S DOUT (spk) | 15 |
| PA Enable | 46 |
| Boot Button | 0 |

## Troubleshooting

- **No WiFi**: Check SSID/password in `main.cpp`
- **Gateway FAIL**: Ensure CT103 is reachable from your WiFi network
- **No audio**: Check PA enable pin (GPIO46)
- **Noisy recording**: First 1024 bytes are discarded to reduce startup noise
