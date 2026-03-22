/**
 * @file wyoming_client.c
 * @brief Voice Gateway client - full pipeline: audio -> STT -> Beergate -> TTS -> speaker
 *
 * Sends recorded PCM16 audio as multipart/form-data to the Voice Gateway.
 * The gateway returns a WAV file with the TTS response.
 * We parse the WAV, play it through the BSP speaker, and extract the transcript.
 */

#include "wyoming_client.h"
#include "audio_capture.h"
#include "esp_log.h"
#include "esp_http_client.h"
#include "bsp/esp-box-3.h"
#include "esp_codec_dev.h"
#include <string.h>
#include <stdlib.h>
#include "esp_heap_caps.h"

static const char *TAG = "GATEWAY";

/* Speaker codec handle */
static esp_codec_dev_handle_t s_spk_dev = NULL;

/* WAV header structure */
typedef struct __attribute__((packed)) {
    char     riff[4];       // "RIFF"
    uint32_t chunk_size;
    char     wave[4];       // "WAVE"
} wav_riff_t;

typedef struct __attribute__((packed)) {
    char     fmt_id[4];     // "fmt "
    uint32_t fmt_size;
    uint16_t audio_format;
    uint16_t num_channels;
    uint32_t sample_rate;
    uint32_t byte_rate;
    uint16_t block_align;
    uint16_t bits_per_sample;
} wav_fmt_t;

typedef struct __attribute__((packed)) {
    char     data_id[4];    // "data"
    uint32_t data_size;
} wav_data_t;

/* HTTP response accumulator */
#define MAX_RESPONSE_SIZE (1024 * 1024)  /* 1MB max WAV response (PSRAM) */

typedef struct {
    uint8_t *buffer;
    size_t   capacity;
    size_t   pos;
} http_response_t;

static esp_err_t http_event_handler(esp_http_client_event_t *evt) {
    http_response_t *resp = (http_response_t *)evt->user_data;

    switch (evt->event_id) {
    case HTTP_EVENT_ON_DATA:
        if (resp && resp->buffer && (resp->pos + evt->data_len <= resp->capacity)) {
            memcpy(resp->buffer + resp->pos, evt->data, evt->data_len);
            resp->pos += evt->data_len;
        }
        break;
    default:
        break;
    }
    return ESP_OK;
}

/* ── Speaker init ────────────────────────────────────────── */

esp_err_t voice_gateway_init_speaker(void) {
    if (s_spk_dev) return ESP_OK;

    s_spk_dev = bsp_audio_codec_speaker_init();
    if (!s_spk_dev) {
        ESP_LOGE(TAG, "Failed to init speaker codec");
        return ESP_FAIL;
    }

    esp_codec_dev_set_out_vol(s_spk_dev, 100);
    ESP_LOGI(TAG, "Speaker initialized (vol=100)");
    return ESP_OK;
}

/* ── WAV playback ────────────────────────────────────────── */

static esp_err_t play_wav(const uint8_t *wav, size_t wav_len) {
    if (!s_spk_dev) {
        ESP_LOGE(TAG, "Speaker not initialized");
        return ESP_FAIL;
    }
    if (wav_len < sizeof(wav_riff_t) + sizeof(wav_fmt_t) + sizeof(wav_data_t)) {
        ESP_LOGE(TAG, "WAV too small: %zu bytes", wav_len);
        return ESP_ERR_INVALID_SIZE;
    }

    /* Parse RIFF header */
    const wav_riff_t *riff = (const wav_riff_t *)wav;
    if (memcmp(riff->riff, "RIFF", 4) != 0 || memcmp(riff->wave, "WAVE", 4) != 0) {
        ESP_LOGE(TAG, "Invalid WAV header");
        return ESP_ERR_INVALID_ARG;
    }

    /* Find fmt chunk */
    size_t offset = sizeof(wav_riff_t);
    const wav_fmt_t *fmt = NULL;
    const uint8_t *pcm_data = NULL;
    uint32_t pcm_size = 0;

    while (offset + 8 <= wav_len) {
        const char *chunk_id = (const char *)(wav + offset);
        uint32_t chunk_size = *(const uint32_t *)(wav + offset + 4);

        if (memcmp(chunk_id, "fmt ", 4) == 0) {
            fmt = (const wav_fmt_t *)(wav + offset);
        } else if (memcmp(chunk_id, "data", 4) == 0) {
            pcm_data = wav + offset + 8;
            pcm_size = chunk_size;
            if (offset + 8 + pcm_size > wav_len) {
                pcm_size = wav_len - offset - 8;
            }
            break;
        }
        offset += 8 + chunk_size;
        if (chunk_size % 2) offset++;  /* word-align */
    }

    if (!fmt || !pcm_data || pcm_size == 0) {
        ESP_LOGE(TAG, "Could not find fmt/data chunks");
        return ESP_ERR_NOT_FOUND;
    }

    ESP_LOGI(TAG, "WAV: %uHz %uch %ubit, %lu bytes PCM",
             fmt->sample_rate, fmt->num_channels,
             fmt->bits_per_sample, (unsigned long)pcm_size);

    /* Pause mic to free I2S bus for speaker */
    audio_capture_pause();

    /* Always open codec as stereo — I2S bus on Box-3 is 2ch */
    esp_codec_dev_sample_info_t fs = {
        .sample_rate     = fmt->sample_rate,
        .channel         = 2,
        .bits_per_sample = fmt->bits_per_sample,
    };
    esp_err_t err = esp_codec_dev_open(s_spk_dev, &fs);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "codec_dev_open failed: %s", esp_err_to_name(err));
        audio_capture_resume();
        return err;
    }

    /* DMA-safe internal RAM buffer (PSRAM can't be accessed during I2S DMA) */
    const size_t CHUNK = 4096;
    uint8_t *dma_buf = (uint8_t *)heap_caps_malloc(CHUNK, MALLOC_CAP_INTERNAL | MALLOC_CAP_8BIT);
    if (!dma_buf) {
        ESP_LOGE(TAG, "Failed to allocate DMA buffer");
        esp_codec_dev_close(s_spk_dev);
        audio_capture_resume();
        return ESP_ERR_NO_MEM;
    }

    size_t played = 0;

    if (fmt->num_channels == 1) {
        /* Mono→Stereo: read half-chunk mono, expand to full-chunk stereo */
        const size_t MONO_CHUNK = CHUNK / 2;
        while (played < pcm_size) {
            size_t mono_bytes = (pcm_size - played > MONO_CHUNK) ? MONO_CHUNK : (pcm_size - played);
            size_t n_samples  = mono_bytes / sizeof(int16_t);

            /* Copy mono from PSRAM into first half of DMA buffer */
            memcpy(dma_buf, pcm_data + played, mono_bytes);

            /* Expand mono→stereo in-place backwards (no overlap issues) */
            int16_t *buf16 = (int16_t *)dma_buf;
            for (int i = (int)n_samples - 1; i >= 0; i--) {
                int16_t s = buf16[i];
                buf16[2 * i]     = s;  /* L */
                buf16[2 * i + 1] = s;  /* R */
            }

            size_t stereo_bytes = n_samples * 2 * sizeof(int16_t);
            err = esp_codec_dev_write(s_spk_dev, dma_buf, stereo_bytes);
            if (err != ESP_OK) {
                ESP_LOGW(TAG, "codec_dev_write error at %zu/%lu", played, (unsigned long)pcm_size);
                break;
            }
            played += mono_bytes;
        }
    } else {
        /* Stereo: copy from PSRAM to internal DMA buffer, write */
        while (played < pcm_size) {
            size_t to_write = (pcm_size - played > CHUNK) ? CHUNK : (pcm_size - played);
            memcpy(dma_buf, pcm_data + played, to_write);
            err = esp_codec_dev_write(s_spk_dev, dma_buf, to_write);
            if (err != ESP_OK) {
                ESP_LOGW(TAG, "codec_dev_write error at %zu/%lu", played, (unsigned long)pcm_size);
                break;
            }
            played += to_write;
        }
    }

    free(dma_buf);
    esp_codec_dev_close(s_spk_dev);

    /* Let speaker fully settle before resuming mic (avoids echo capture) */
    vTaskDelay(pdMS_TO_TICKS(500));

    /* Resume mic after playback */
    audio_capture_resume();

    ESP_LOGI(TAG, "Playback done: %zu bytes", played);
    return ESP_OK;
}

/* ── Multipart helpers ───────────────────────────────────── */

static const char *BOUNDARY = "----BeergateBoundary7d6a";

static void build_wav_header(uint8_t *hdr, uint32_t pcm_bytes) {
    uint32_t file_size = 36 + pcm_bytes;
    memcpy(hdr +  0, "RIFF", 4);
    memcpy(hdr +  4, &file_size, 4);
    memcpy(hdr +  8, "WAVE", 4);
    memcpy(hdr + 12, "fmt ", 4);
    uint32_t fmt_sz = 16; memcpy(hdr + 16, &fmt_sz, 4);
    uint16_t af = 1;      memcpy(hdr + 20, &af, 2);
    uint16_t ch = 1;      memcpy(hdr + 22, &ch, 2);
    uint32_t sr = 16000;  memcpy(hdr + 24, &sr, 4);
    uint32_t br = 32000;  memcpy(hdr + 28, &br, 4);
    uint16_t ba = 2;      memcpy(hdr + 32, &ba, 2);
    uint16_t bp = 16;     memcpy(hdr + 34, &bp, 2);
    memcpy(hdr + 36, "data", 4);
    memcpy(hdr + 40, &pcm_bytes, 4);
}

/* ── Main API ────────────────────────────────────────────── */

esp_err_t wyoming_stt_send(const int16_t *audio_data, size_t audio_size,
                           char **text_out, size_t *text_len,
                           bool skip_trigger) {
    if (!audio_data || audio_size == 0 || !text_out || !text_len) {
        return ESP_ERR_INVALID_ARG;
    }

    ESP_LOGI(TAG, "Sending %zu bytes to Voice Gateway (streaming)...", audio_size);

    /* Prepare multipart parts (small, stack-allocated) */
    char part_hdr[256];
    int part_hdr_len = snprintf(part_hdr, sizeof(part_hdr),
        "--%s\r\n"
        "Content-Disposition: form-data; name=\"audio\"; filename=\"recording.wav\"\r\n"
        "Content-Type: audio/wav\r\n\r\n",
        BOUNDARY);

    uint8_t wav_hdr[44];
    build_wav_header(wav_hdr, (uint32_t)audio_size);

    char part_end[64];
    int part_end_len = snprintf(part_end, sizeof(part_end), "\r\n--%s--\r\n", BOUNDARY);

    int content_length = part_hdr_len + 44 + (int)audio_size + part_end_len;

    /* Build URL */
    char url[128];
    if (skip_trigger) {
        snprintf(url, sizeof(url), "http://%s:%d/api/voice/process?skip_trigger=true", GATEWAY_HOST, GATEWAY_PORT);
    } else {
        snprintf(url, sizeof(url), "http://%s:%d/api/voice/process", GATEWAY_HOST, GATEWAY_PORT);
    }

    /* Content-Type with boundary */
    char ct[80];
    snprintf(ct, sizeof(ct), "multipart/form-data; boundary=%s", BOUNDARY);

    /* HTTP client config — response handled via event callback */
    http_response_t resp = {
        .buffer   = (uint8_t *)heap_caps_malloc(MAX_RESPONSE_SIZE, MALLOC_CAP_SPIRAM | MALLOC_CAP_8BIT),
        .capacity = MAX_RESPONSE_SIZE,
        .pos      = 0,
    };
    if (!resp.buffer) {
        resp.buffer = (uint8_t *)malloc(MAX_RESPONSE_SIZE);
    }
    if (!resp.buffer) {
        ESP_LOGE(TAG, "No memory for response buffer");
        return ESP_ERR_NO_MEM;
    }

    esp_http_client_config_t cfg = {
        .url            = url,
        .method         = HTTP_METHOD_POST,
        .timeout_ms     = GATEWAY_TIMEOUT_MS,
        .event_handler  = NULL,
        .user_data      = NULL,
        .buffer_size    = 4096,
        .buffer_size_tx = 2048,
    };

    esp_http_client_handle_t client = esp_http_client_init(&cfg);
    if (!client) {
        free(resp.buffer);
        return ESP_FAIL;
    }

    esp_http_client_set_header(client, "Content-Type", ct);

    /* Streaming upload: open connection, write body in pieces, no big buffer needed */
    esp_err_t err = esp_http_client_open(client, content_length);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "HTTP open failed: %s", esp_err_to_name(err));
        esp_http_client_cleanup(client);
        free(resp.buffer);
        return err;
    }

    /* Write multipart header + WAV header */
    esp_http_client_write(client, part_hdr, part_hdr_len);
    esp_http_client_write(client, (const char *)wav_hdr, 44);

    /* Stream audio data in 4KB chunks — no copy needed */
    const size_t CHUNK = 4096;
    const uint8_t *audio_bytes = (const uint8_t *)audio_data;
    size_t sent = 0;
    while (sent < audio_size) {
        size_t to_send = (audio_size - sent > CHUNK) ? CHUNK : (audio_size - sent);
        int written = esp_http_client_write(client, (const char *)(audio_bytes + sent), to_send);
        if (written < 0) {
            ESP_LOGE(TAG, "Write error at offset %zu", sent);
            esp_http_client_cleanup(client);
            free(resp.buffer);
            return ESP_FAIL;
        }
        sent += to_send;
    }

    /* Write multipart footer */
    esp_http_client_write(client, part_end, part_end_len);

    /* Fetch response headers */
    int resp_content_len = esp_http_client_fetch_headers(client);
    ESP_LOGI(TAG, "Response Content-Length: %d", resp_content_len);

    /* Read response body — cap at Content-Length to avoid reading garbage */
    {
        int read_len;
        char tmp[4096];
        size_t max_read = (resp_content_len > 0) ? (size_t)resp_content_len : resp.capacity;
        if (max_read > resp.capacity) max_read = resp.capacity;
        while (resp.pos < max_read &&
               (read_len = esp_http_client_read(client, tmp, sizeof(tmp))) > 0) {
            size_t to_copy = (size_t)read_len;
            if (resp.pos + to_copy > max_read) {
                to_copy = max_read - resp.pos;
            }
            memcpy(resp.buffer + resp.pos, tmp, to_copy);
            resp.pos += to_copy;
        }
    }

    int status = esp_http_client_get_status_code(client);
    esp_http_client_cleanup(client);

    ESP_LOGI(TAG, "Gateway response: HTTP %d, %zu bytes", status, resp.pos);

    /* 204 = no trigger phrase detected (server-side wake word) */
    if (status == 204) {
        ESP_LOGI(TAG, "No trigger phrase — ignored");
        free(resp.buffer);
        *text_out = NULL;
        *text_len = 0;
        return ESP_ERR_NOT_FOUND;
    }

    if (status != 200 || resp.pos < 44) {
        ESP_LOGE(TAG, "Bad response (status=%d, size=%zu)", status, resp.pos);
        free(resp.buffer);
        return ESP_FAIL;
    }

    /* The response is a WAV file — play it through speaker */
    ESP_LOGI(TAG, "Playing TTS response (%zu bytes)...", resp.pos);
    play_wav(resp.buffer, resp.pos);

    /* Return a generic transcript (the gateway doesn't include transcript in WAV response) */
    *text_out = strdup("Respuesta reproducida");
    *text_len = strlen(*text_out);

    free(resp.buffer);
    return ESP_OK;
}

/* ── Health check ────────────────────────────────────────── */

esp_err_t voice_gateway_health_check(void) {
    char url[64];
    snprintf(url, sizeof(url), "http://%s:%d/api/health", GATEWAY_HOST, GATEWAY_PORT);

    char buf[256] = {0};
    http_response_t resp = { .buffer = (uint8_t *)buf, .capacity = sizeof(buf) - 1, .pos = 0 };

    esp_http_client_config_t cfg = {
        .url           = url,
        .method        = HTTP_METHOD_GET,
        .timeout_ms    = 5000,
        .event_handler = http_event_handler,
        .user_data     = &resp,
    };

    esp_http_client_handle_t client = esp_http_client_init(&cfg);
    if (!client) return ESP_FAIL;

    esp_err_t err = esp_http_client_perform(client);
    int status = esp_http_client_get_status_code(client);
    esp_http_client_cleanup(client);

    if (err == ESP_OK && status == 200) {
        ESP_LOGI(TAG, "Gateway health OK: %s", buf);
        return ESP_OK;
    }

    ESP_LOGE(TAG, "Gateway health FAIL: err=%s status=%d", esp_err_to_name(err), status);
    return ESP_FAIL;
}
