/**
 * Beergate Voice Client — ESP32-S3-Box
 *
 * Records audio on button press, POSTs WAV to Voice Gateway,
 * plays back audio response.
 *
 * Architecture:
 *   Button press → Record mic → HTTP POST /api/voice/process → Play response
 *
 * Hardware:
 *   - ESP32-S3-Box: I2S mic (ES7210), I2S speaker (ES8311), ILI9341 display
 *   - Boot button (GPIO0) triggers recording
 */

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <driver/i2s.h>
#include <ArduinoJson.h>

// ── Configuration ──────────────────────────────────────────────────
// TODO: Move these to a config file or use WiFiManager
static const char *WIFI_SSID     = "Casa_HS_Wifi";
static const char *WIFI_PASS     = "ErizoDespenado22";
static const char *GATEWAY_URL   = "http://192.168.30.102:8000/api/voice/process";
static const char *HEALTH_URL    = "http://192.168.30.102:8000/api/health";

// ── I2S pins for ESP32-S3-Box ──────────────────────────────────────
// Microphone (ES7210 ADC)
#define I2S_MIC_PORT     I2S_NUM_0
#define I2S_MIC_BCLK     GPIO_NUM_17
#define I2S_MIC_WS       GPIO_NUM_45
#define I2S_MIC_DIN      GPIO_NUM_16

// Speaker (ES8311 DAC)
#define I2S_SPK_PORT     I2S_NUM_1
#define I2S_SPK_BCLK     GPIO_NUM_17
#define I2S_SPK_WS       GPIO_NUM_45
#define I2S_SPK_DOUT     GPIO_NUM_15

// Power amplifier enable
#define PA_ENABLE_PIN    GPIO_NUM_46

// Button
#define BUTTON_PIN       GPIO_NUM_0

// ── Audio parameters ───────────────────────────────────────────────
#define SAMPLE_RATE      16000
#define BITS_PER_SAMPLE  I2S_BITS_PER_SAMPLE_16BIT
#define CHANNELS         1
#define RECORD_SECONDS   5
#define RECORD_BYTES     (SAMPLE_RATE * 2 * RECORD_SECONDS)  // 16-bit = 2 bytes

// ── Buffers (PSRAM) ───────────────────────────────────────────────
static uint8_t *audioBuffer    = nullptr;
static uint8_t *responseBuffer = nullptr;
static const size_t MAX_RESPONSE_SIZE = 1024 * 1024;  // 1 MB max response

// ── State ─────────────────────────────────────────────────────────
enum State {
    STATE_IDLE,
    STATE_RECORDING,
    STATE_SENDING,
    STATE_PLAYING,
    STATE_ERROR
};
volatile State currentState = STATE_IDLE;

// ── WAV header ────────────────────────────────────────────────────
struct WavHeader {
    char     riff[4]       = {'R','I','F','F'};
    uint32_t chunkSize     = 0;
    char     wave[4]       = {'W','A','V','E'};
    char     fmt[4]        = {'f','m','t',' '};
    uint32_t fmtSize       = 16;
    uint16_t audioFormat   = 1;  // PCM
    uint16_t numChannels   = 1;
    uint32_t sampleRate    = SAMPLE_RATE;
    uint32_t byteRate      = SAMPLE_RATE * 2;
    uint16_t blockAlign    = 2;
    uint16_t bitsPerSample = 16;
    char     data[4]       = {'d','a','t','a'};
    uint32_t dataSize      = 0;
} __attribute__((packed));

// ── Forward declarations ──────────────────────────────────────────
void initI2SMic();
void initI2SSpk();
void deinitI2S(i2s_port_t port);
size_t recordAudio(uint8_t *buffer, size_t maxBytes);
bool sendToGateway(uint8_t *wavData, size_t wavLen, uint8_t *response, size_t *responseLen);
void playAudio(uint8_t *wavData, size_t wavLen);
void printStatus(const char *msg);

// ══════════════════════════════════════════════════════════════════
void setup() {
    Serial.begin(115200);
    delay(1000);
    Serial.println("\n=== Beergate Voice Client ===");

    // Button
    pinMode(BUTTON_PIN, INPUT_PULLUP);

    // PA enable
    pinMode(PA_ENABLE_PIN, OUTPUT);
    digitalWrite(PA_ENABLE_PIN, LOW);

    // Allocate buffers in PSRAM
    audioBuffer = (uint8_t *)ps_malloc(RECORD_BYTES + sizeof(WavHeader));
    responseBuffer = (uint8_t *)ps_malloc(MAX_RESPONSE_SIZE);
    if (!audioBuffer || !responseBuffer) {
        Serial.println("ERROR: Failed to allocate PSRAM buffers!");
        while (true) delay(1000);
    }
    Serial.printf("PSRAM: %d bytes free\n", ESP.getFreePsram());

    // WiFi
    Serial.printf("Connecting to WiFi: %s\n", WIFI_SSID);
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    int retries = 0;
    while (WiFi.status() != WL_CONNECTED && retries < 30) {
        delay(500);
        Serial.print(".");
        retries++;
    }
    if (WiFi.status() == WL_CONNECTED) {
        Serial.printf("\nWiFi connected! IP: %s\n", WiFi.localIP().toString().c_str());
    } else {
        Serial.println("\nWiFi FAILED — entering AP mode");
    }

    // Health check
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin(HEALTH_URL);
        int code = http.GET();
        if (code == 200) {
            Serial.println("Gateway health: OK");
        } else {
            Serial.printf("Gateway health: FAIL (%d)\n", code);
        }
        http.end();
    }

    Serial.println("\nReady! Press BOOT button to talk.");
    currentState = STATE_IDLE;
}

// ══════════════════════════════════════════════════════════════════
void loop() {
    // Wait for button press (active LOW)
    if (digitalRead(BUTTON_PIN) == LOW && currentState == STATE_IDLE) {
        delay(50);  // debounce
        if (digitalRead(BUTTON_PIN) == LOW) {
            processVoice();
        }
    }
    delay(10);
}

// ── Main voice processing pipeline ───────────────────────────────
void processVoice() {
    Serial.println("\n--- Voice Pipeline Start ---");

    // 1. Record
    currentState = STATE_RECORDING;
    printStatus("Recording...");
    initI2SMic();

    WavHeader header;
    size_t pcmBytes = recordAudio(audioBuffer + sizeof(WavHeader), RECORD_BYTES);

    deinitI2S(I2S_MIC_PORT);

    if (pcmBytes == 0) {
        Serial.println("ERROR: No audio recorded");
        currentState = STATE_ERROR;
        delay(1000);
        currentState = STATE_IDLE;
        return;
    }

    // Build WAV
    header.dataSize = pcmBytes;
    header.chunkSize = 36 + pcmBytes;
    memcpy(audioBuffer, &header, sizeof(WavHeader));
    size_t wavSize = sizeof(WavHeader) + pcmBytes;
    Serial.printf("Recorded: %d bytes PCM, %d bytes WAV\n", pcmBytes, wavSize);

    // 2. Send to gateway
    currentState = STATE_SENDING;
    printStatus("Processing...");
    size_t responseLen = 0;
    bool ok = sendToGateway(audioBuffer, wavSize, responseBuffer, &responseLen);

    if (!ok || responseLen < 44) {
        Serial.println("ERROR: Gateway request failed");
        currentState = STATE_ERROR;
        delay(1000);
        currentState = STATE_IDLE;
        return;
    }

    Serial.printf("Response: %d bytes WAV\n", responseLen);

    // 3. Play response
    currentState = STATE_PLAYING;
    printStatus("Speaking...");
    playAudio(responseBuffer, responseLen);

    currentState = STATE_IDLE;
    printStatus("Ready");
    Serial.println("--- Voice Pipeline Done ---\n");
}

// ── I2S Microphone init ──────────────────────────────────────────
void initI2SMic() {
    i2s_config_t config = {
        .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
        .sample_rate = SAMPLE_RATE,
        .bits_per_sample = BITS_PER_SAMPLE,
        .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
        .communication_format = I2S_COMM_FORMAT_STAND_I2S,
        .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
        .dma_buf_count = 4,
        .dma_buf_len = 1024,
        .use_apll = false,
        .tx_desc_auto_clear = false,
        .fixed_mclk = 0
    };

    i2s_pin_config_t pins = {
        .bck_io_num = I2S_MIC_BCLK,
        .ws_io_num = I2S_MIC_WS,
        .data_out_num = I2S_PIN_NO_CHANGE,
        .data_in_num = I2S_MIC_DIN
    };

    i2s_driver_install(I2S_MIC_PORT, &config, 0, NULL);
    i2s_set_pin(I2S_MIC_PORT, &pins);
    i2s_zero_dma_buffer(I2S_MIC_PORT);
}

// ── I2S Speaker init ─────────────────────────────────────────────
void initI2SSpk() {
    i2s_config_t config = {
        .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
        .sample_rate = 22050,  // Piper outputs 22050
        .bits_per_sample = BITS_PER_SAMPLE,
        .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
        .communication_format = I2S_COMM_FORMAT_STAND_I2S,
        .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
        .dma_buf_count = 8,
        .dma_buf_len = 1024,
        .use_apll = false,
        .tx_desc_auto_clear = true,
        .fixed_mclk = 0
    };

    i2s_pin_config_t pins = {
        .bck_io_num = I2S_SPK_BCLK,
        .ws_io_num = I2S_SPK_WS,
        .data_out_num = I2S_SPK_DOUT,
        .data_in_num = I2S_PIN_NO_CHANGE
    };

    i2s_driver_install(I2S_SPK_PORT, &config, 0, NULL);
    i2s_set_pin(I2S_SPK_PORT, &pins);
    i2s_zero_dma_buffer(I2S_SPK_PORT);
}

void deinitI2S(i2s_port_t port) {
    i2s_driver_uninstall(port);
}

// ── Record audio from mic ────────────────────────────────────────
size_t recordAudio(uint8_t *buffer, size_t maxBytes) {
    size_t totalRead = 0;
    size_t bytesRead = 0;
    const size_t chunkSize = 1024;

    // Discard initial noisy samples
    uint8_t discard[1024];
    i2s_read(I2S_MIC_PORT, discard, sizeof(discard), &bytesRead, portMAX_DELAY);

    unsigned long startMs = millis();
    unsigned long maxMs = RECORD_SECONDS * 1000;

    Serial.print("REC: ");
    while (totalRead < maxBytes && (millis() - startMs) < maxMs) {
        // Stop early if button released
        if (digitalRead(BUTTON_PIN) == HIGH && (millis() - startMs) > 500) {
            Serial.println(" [released]");
            break;
        }

        size_t toRead = min(chunkSize, maxBytes - totalRead);
        esp_err_t err = i2s_read(I2S_MIC_PORT, buffer + totalRead, toRead, &bytesRead, 100);
        if (err == ESP_OK && bytesRead > 0) {
            totalRead += bytesRead;
        }

        // Progress dot every 0.5s
        if (((millis() - startMs) % 500) < 15) {
            Serial.print(".");
        }
    }
    Serial.printf(" %d bytes (%.1fs)\n", totalRead, (millis() - startMs) / 1000.0);
    return totalRead;
}

// ── Send WAV to gateway, receive response WAV ───────────────────
bool sendToGateway(uint8_t *wavData, size_t wavLen, uint8_t *response, size_t *responseLen) {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("ERROR: WiFi not connected");
        return false;
    }

    HTTPClient http;
    http.begin(GATEWAY_URL);
    http.setTimeout(60000);  // 60s timeout for STT+API+TTS

    // Build multipart form data
    // Boundary
    String boundary = "----BeergateBoundary";
    String contentType = "multipart/form-data; boundary=" + boundary;
    http.addHeader("Content-Type", contentType);

    // Build body: header + wav data + footer
    String header = "--" + boundary + "\r\n"
                    "Content-Disposition: form-data; name=\"audio\"; filename=\"voice.wav\"\r\n"
                    "Content-Type: audio/wav\r\n\r\n";
    String footer = "\r\n--" + boundary + "--\r\n";

    size_t totalLen = header.length() + wavLen + footer.length();

    // Stream upload
    uint8_t *body = (uint8_t *)ps_malloc(totalLen);
    if (!body) {
        Serial.println("ERROR: Cannot allocate upload buffer");
        return false;
    }

    size_t offset = 0;
    memcpy(body + offset, header.c_str(), header.length());
    offset += header.length();
    memcpy(body + offset, wavData, wavLen);
    offset += wavLen;
    memcpy(body + offset, footer.c_str(), footer.length());
    offset += footer.length();

    Serial.printf("Sending %d bytes to gateway...\n", totalLen);
    int httpCode = http.POST(body, totalLen);
    free(body);

    if (httpCode != 200) {
        Serial.printf("ERROR: Gateway returned %d\n", httpCode);
        if (httpCode > 0) {
            Serial.println(http.getString().substring(0, 200));
        }
        http.end();
        return false;
    }

    // Read response headers
    String transcript = http.header("X-Transcript");
    String responseText = http.header("X-Response-Text");
    if (transcript.length() > 0) {
        Serial.printf("Transcript: %s\n", transcript.c_str());
    }
    if (responseText.length() > 0) {
        Serial.printf("Response: %s\n", responseText.c_str());
    }

    // Read response body (WAV audio)
    int len = http.getSize();
    if (len <= 0 || len > (int)MAX_RESPONSE_SIZE) {
        Serial.printf("ERROR: Invalid response size: %d\n", len);
        http.end();
        return false;
    }

    WiFiClient *stream = http.getStreamPtr();
    size_t read = 0;
    while (read < (size_t)len) {
        size_t available = stream->available();
        if (available > 0) {
            size_t toRead = min(available, (size_t)(len - read));
            toRead = min(toRead, (size_t)4096);
            size_t got = stream->readBytes(response + read, toRead);
            read += got;
        } else {
            delay(1);
        }
    }

    *responseLen = read;
    Serial.printf("Received: %d bytes audio\n", read);
    http.end();
    return true;
}

// ── Play audio from WAV buffer ───────────────────────────────────
void playAudio(uint8_t *wavData, size_t wavLen) {
    if (wavLen < 44) return;

    // Parse WAV header to get sample rate
    uint32_t sampleRate = *(uint32_t *)(wavData + 24);
    uint16_t bitsPerSample = *(uint16_t *)(wavData + 34);
    uint32_t dataOffset = 44;  // Standard WAV header

    Serial.printf("Playing: %dHz %dbit, %d bytes\n", sampleRate, bitsPerSample, wavLen - dataOffset);

    // Enable PA
    digitalWrite(PA_ENABLE_PIN, HIGH);
    delay(50);

    // Init speaker with response sample rate
    i2s_config_t config = {
        .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
        .sample_rate = sampleRate,
        .bits_per_sample = BITS_PER_SAMPLE,
        .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
        .communication_format = I2S_COMM_FORMAT_STAND_I2S,
        .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
        .dma_buf_count = 8,
        .dma_buf_len = 1024,
        .use_apll = false,
        .tx_desc_auto_clear = true,
        .fixed_mclk = 0
    };

    i2s_pin_config_t pins = {
        .bck_io_num = I2S_SPK_BCLK,
        .ws_io_num = I2S_SPK_WS,
        .data_out_num = I2S_SPK_DOUT,
        .data_in_num = I2S_PIN_NO_CHANGE
    };

    i2s_driver_install(I2S_SPK_PORT, &config, 0, NULL);
    i2s_set_pin(I2S_SPK_PORT, &pins);

    // Write audio data
    size_t bytesWritten = 0;
    size_t remaining = wavLen - dataOffset;
    uint8_t *ptr = wavData + dataOffset;
    size_t chunkSize = 4096;

    while (remaining > 0) {
        size_t toWrite = min(chunkSize, remaining);
        i2s_write(I2S_SPK_PORT, ptr, toWrite, &bytesWritten, portMAX_DELAY);
        ptr += bytesWritten;
        remaining -= bytesWritten;
    }

    // Flush
    delay(100);
    i2s_zero_dma_buffer(I2S_SPK_PORT);
    deinitI2S(I2S_SPK_PORT);

    // Disable PA
    digitalWrite(PA_ENABLE_PIN, LOW);

    Serial.println("Playback done");
}

// ── Status display helper ────────────────────────────────────────
void printStatus(const char *msg) {
    Serial.printf("[%s] %s\n",
        currentState == STATE_IDLE ? "IDLE" :
        currentState == STATE_RECORDING ? "REC" :
        currentState == STATE_SENDING ? "SEND" :
        currentState == STATE_PLAYING ? "PLAY" : "ERR",
        msg);
}
