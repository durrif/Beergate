# voice-gateway/main.py — Beergate Voice Gateway for CT 103
"""
Voice Gateway: bridges ESP32-S3-Box ↔ Wyoming Whisper/Piper ↔ Beergate API.

Receives raw audio from ESP32, transcribes with Whisper, sends command to
Beergate, synthesizes response with Piper, returns audio to ESP32.

Includes Claude AI fallback for commands the regex handler doesn't understand.
"""

import asyncio
import io
import logging
import os
import struct
import wave
from contextlib import asynccontextmanager

import numpy as np
import httpx
import anthropic
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from wyoming.asr import Transcribe, Transcript
from wyoming.audio import AudioChunk, AudioStart, AudioStop
from wyoming.client import AsyncTcpClient
from wyoming.event import async_read_event, async_write_event
from wyoming.tts import Synthesize

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("voice-gateway")

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
WHISPER_HOST = os.getenv("WHISPER_HOST", "wyoming-whisper")
WHISPER_PORT = int(os.getenv("WHISPER_PORT", "10300"))
PIPER_HOST = os.getenv("PIPER_HOST", "wyoming-piper")
PIPER_PORT = int(os.getenv("PIPER_PORT", "10200"))
BEERGATE_API_URL = os.getenv("BEERGATE_API_URL", "http://192.168.30.101:8080/api")
BEERGATE_AUTH_EMAIL = os.getenv("BEERGATE_AUTH_EMAIL", "admin@beergate.es")
BEERGATE_AUTH_PASSWORD = os.getenv("BEERGATE_AUTH_PASSWORD", "beergate2025!")
PIPER_VOICE = os.getenv("PIPER_VOICE", "es_ES-davefx-medium")
DEFAULT_LANGUAGE = os.getenv("DEFAULT_LANGUAGE", "es")
TRIGGER_PHRASE = os.getenv("TRIGGER_PHRASE", "cervecero")  # Server-side wake word
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

# ---------------------------------------------------------------------------
# Auth token cache
# ---------------------------------------------------------------------------
_token_cache: dict[str, str] = {}


async def get_beergate_token(client: httpx.AsyncClient) -> str:
    """Obtain (and cache) a JWT token from Beergate API."""
    if "access_token" in _token_cache:
        return _token_cache["access_token"]

    resp = await client.post(
        f"{BEERGATE_API_URL}/v1/auth/login",
        json={"email": BEERGATE_AUTH_EMAIL, "password": BEERGATE_AUTH_PASSWORD},
    )
    if resp.status_code != 200:
        logger.error("Beergate login failed: %s %s", resp.status_code, resp.text)
        raise HTTPException(502, "Cannot authenticate with Beergate API")

    token = resp.json()["access_token"]
    _token_cache["access_token"] = token
    return token


async def call_beergate_voice(text: str) -> tuple[str, float]:
    """Send transcribed text to Beergate voice/command endpoint.
    Returns (reply_text, confidence)."""
    async with httpx.AsyncClient(timeout=30) as client:
        token = await get_beergate_token(client)
        resp = await client.post(
            f"{BEERGATE_API_URL}/v1/voice/command",
            json={"text": text, "language": DEFAULT_LANGUAGE},
            headers={"Authorization": f"Bearer {token}"},
        )
        if resp.status_code == 401:
            # Token expired — retry once
            _token_cache.clear()
            token = await get_beergate_token(client)
            resp = await client.post(
                f"{BEERGATE_API_URL}/v1/voice/command",
                json={"text": text, "language": DEFAULT_LANGUAGE},
                headers={"Authorization": f"Bearer {token}"},
            )
        if resp.status_code != 200:
            logger.error("Beergate voice error: %s %s", resp.status_code, resp.text)
            return "Lo siento, no he podido procesar tu petición.", 0.0

        data = resp.json()
        reply = data.get("reply", data.get("response", "Sin respuesta."))
        confidence = data.get("confidence", 1.0)
        return reply, confidence


# ---------------------------------------------------------------------------
# Claude AI fallback
# ---------------------------------------------------------------------------
CLAUDE_SYSTEM_PROMPT = """Eres el asistente de voz de Beergate, una cervecería artesanal.
Respondes en español, de forma breve y natural (máximo 2-3 frases cortas).
Eres experto en cerveza artesanal: ingredientes, recetas, procesos de elaboración,
fermentación, IBU, OG, FG, ABV, SRM, maridaje y estilos BJCP.
Tienes acceso al inventario y datos de la cervecería que se te proporcionan como contexto.
Responde de forma conversacional, como si hablaras por voz. No uses listas, markdown ni formato."""


async def fetch_beergate_context(client: httpx.AsyncClient, token: str) -> str:
    """Fetch current brewery data from Beergate API to give Claude context."""
    context_parts = []

    # Inventory summary (paginated: {items: [...], total, ...})
    try:
        resp = await client.get(
            f"{BEERGATE_API_URL}/v1/inventory",
            params={"page_size": 50},
            headers={"Authorization": f"Bearer {token}"},
            timeout=10,
        )
        if resp.status_code == 200:
            data = resp.json()
            items = data.get("items", data) if isinstance(data, dict) else data
            if isinstance(items, list):
                inv_lines = []
                for item in items[:30]:
                    name = item.get("name", "?")
                    qty = item.get("quantity", "?")
                    unit = item.get("unit", "")
                    cat = item.get("category", "")
                    inv_lines.append(f"- {name} ({cat}): {qty} {unit}")
                if inv_lines:
                    context_parts.append("INVENTARIO:\n" + "\n".join(inv_lines))
    except Exception as e:
        logger.debug("Could not fetch inventory context: %s", e)

    # Active brews (flat list)
    try:
        resp = await client.get(
            f"{BEERGATE_API_URL}/v1/brewing",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10,
        )
        if resp.status_code == 200:
            brews = resp.json()
            if isinstance(brews, list) and brews:
                brew_lines = []
                for brew in brews[:5]:
                    name = brew.get("name", "?")
                    phase = brew.get("phase", "?")
                    og = brew.get("actual_og") or brew.get("planned_og", "")
                    liters = brew.get("actual_batch_liters") or brew.get("planned_batch_liters", "")
                    line = f"- {name}: fase={phase}"
                    if liters:
                        line += f", {liters}L"
                    if og:
                        line += f", OG={og}"
                    brew_lines.append(line)
                context_parts.append("ELABORACIONES ACTIVAS:\n" + "\n".join(brew_lines))
    except Exception as e:
        logger.debug("Could not fetch brewing context: %s", e)

    return "\n\n".join(context_parts) if context_parts else ""


async def call_claude(text: str) -> str:
    """Call Claude API as intelligent fallback for unrecognized voice commands."""
    if not ANTHROPIC_API_KEY:
        logger.warning("ANTHROPIC_API_KEY not set — Claude fallback disabled")
        return "No entendí el comando. ¿Puedes repetirlo?"

    try:
        # Fetch brewery context from Beergate API
        context = ""
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                token = await get_beergate_token(client)
                context = await fetch_beergate_context(client, token)
        except Exception as e:
            logger.warning("Could not fetch Beergate context for Claude: %s", e)

        # Build messages with context
        user_message = text
        if context:
            user_message = f"[Datos actuales de la cervecería]\n{context}\n\n[Pregunta del usuario]\n{text}"

        # Call Claude (non-streaming for voice — need complete response)
        claude = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        response = claude.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=200,
            system=CLAUDE_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )

        reply = response.content[0].text.strip()
        logger.info("Claude response: '%s'", reply[:200])
        return reply

    except Exception as e:
        logger.error("Claude API error: %s", e)
        return "Lo siento, ha habido un problema con el asistente. ¿Puedes repetirlo?"


# ---------------------------------------------------------------------------
# Wyoming helpers
# ---------------------------------------------------------------------------
async def whisper_stt(audio_bytes: bytes, sample_rate: int = 16000) -> str:
    """Send PCM audio to Wyoming Whisper and return transcript."""
    client = AsyncTcpClient(WHISPER_HOST, WHISPER_PORT)
    await client.connect()

    try:
        # Send transcribe request
        await async_write_event(
            Transcribe(language=DEFAULT_LANGUAGE).event(), client._writer
        )

        # Send audio start
        await async_write_event(
            AudioStart(rate=sample_rate, width=2, channels=1).event(), client._writer
        )

        # Send audio in chunks (4096 bytes each)
        chunk_size = 4096
        for i in range(0, len(audio_bytes), chunk_size):
            chunk_data = audio_bytes[i : i + chunk_size]
            chunk = AudioChunk(
                audio=chunk_data, rate=sample_rate, width=2, channels=1
            )
            await async_write_event(chunk.event(), client._writer)

        # Send audio stop
        await async_write_event(AudioStop().event(), client._writer)

        # Read transcript
        while True:
            event = await asyncio.wait_for(
                async_read_event(client._reader), timeout=30
            )
            if event is None:
                break
            if Transcript.is_type(event.type):
                transcript = Transcript.from_event(event)
                return transcript.text.strip()

        return ""
    finally:
        await client.disconnect()


async def piper_tts(text: str) -> tuple[bytes, int]:
    """Send text to Wyoming Piper and return (wav_bytes, sample_rate)."""
    client = AsyncTcpClient(PIPER_HOST, PIPER_PORT)
    await client.connect()

    try:
        await async_write_event(Synthesize(text=text).event(), client._writer)

        audio_data = bytearray()
        sample_rate = 22050

        while True:
            event = await asyncio.wait_for(
                async_read_event(client._reader), timeout=30
            )
            if event is None:
                break
            if AudioChunk.is_type(event.type):
                chunk = AudioChunk.from_event(event)
                audio_data.extend(chunk.audio)
                sample_rate = chunk.rate
            elif AudioStop.is_type(event.type):
                break

        # Resample to 16000Hz for ESP32 (mic runs at 16kHz, shared I2S bus)
        target_rate = 16000
        if sample_rate != target_rate and len(audio_data) > 0:
            samples = np.frombuffer(bytes(audio_data), dtype=np.int16)
            n_in = len(samples)
            n_out = int(n_in * target_rate / sample_rate)
            samples_f = samples.astype(np.float64)

            # Anti-aliasing FIR low-pass filter (Blackman-windowed sinc)
            cutoff = target_rate / sample_rate * 0.95  # just below new Nyquist
            n_taps = 256
            t = np.arange(n_taps) - (n_taps - 1) / 2.0
            with np.errstate(divide='ignore', invalid='ignore'):
                h = np.where(t == 0, 2 * cutoff, np.sin(2 * np.pi * cutoff * t) / (np.pi * t))
            h *= np.blackman(n_taps)
            h /= h.sum()
            samples_f = np.convolve(samples_f, h, mode='same')

            # Resample via linear interpolation (safe after anti-aliasing)
            x_new = np.linspace(0, n_in - 1, n_out)
            resampled = np.interp(x_new, np.arange(n_in), samples_f)
            resampled = np.clip(resampled, -32768, 32767)
            audio_data = resampled.astype(np.int16).tobytes()
            logger.info("Resampled TTS: %dHz -> %dHz (%d -> %d samples)",
                        sample_rate, target_rate, n_in, n_out)
            sample_rate = target_rate

        # Build WAV file
        wav_buffer = io.BytesIO()
        with wave.open(wav_buffer, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(sample_rate)
            wf.writeframes(bytes(audio_data))

        return wav_buffer.getvalue(), sample_rate
    finally:
        await client.disconnect()


def extract_pcm_from_wav(wav_bytes: bytes) -> tuple[bytes, int]:
    """Extract raw PCM data and sample rate from a WAV file."""
    with wave.open(io.BytesIO(wav_bytes), "rb") as wf:
        sample_rate = wf.getframerate()
        pcm = wf.readframes(wf.getnframes())
        return pcm, sample_rate


# ---------------------------------------------------------------------------
# FastAPI Application
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(
        "Voice Gateway starting — Whisper=%s:%d, Piper=%s:%d, Beergate=%s",
        WHISPER_HOST, WHISPER_PORT, PIPER_HOST, PIPER_PORT, BEERGATE_API_URL,
    )
    yield
    logger.info("Voice Gateway shutting down")


app = FastAPI(
    title="Beergate Voice Gateway",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ESP32 doesn't send Origin headers
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    """Health check — also verifies Whisper/Piper connectivity."""
    whisper_ok = False
    piper_ok = False

    try:
        client = AsyncTcpClient(WHISPER_HOST, WHISPER_PORT)
        await client.connect()
        await client.disconnect()
        whisper_ok = True
    except Exception:
        pass

    try:
        client = AsyncTcpClient(PIPER_HOST, PIPER_PORT)
        await client.connect()
        await client.disconnect()
        piper_ok = True
    except Exception:
        pass

    return {
        "status": "ok" if (whisper_ok and piper_ok) else "degraded",
        "whisper": whisper_ok,
        "piper": piper_ok,
        "beergate_url": BEERGATE_API_URL,
    }


@app.post("/api/voice/process")
async def process_voice(audio: UploadFile = File(...), skip_trigger: bool = False):
    """
    Full pipeline: receive WAV audio → STT → Beergate → TTS → return WAV.

    The ESP32 sends a WAV file; we return a WAV file with the spoken response.
    If skip_trigger=true, the wake word check is bypassed (button mode).
    """
    wav_bytes = await audio.read()
    if len(wav_bytes) < 44:
        raise HTTPException(400, "Audio file too small")

    logger.info("Received audio: %d bytes", len(wav_bytes))

    # 1. Extract PCM from WAV
    try:
        pcm_data, sample_rate = extract_pcm_from_wav(wav_bytes)
    except Exception as e:
        logger.error("Invalid WAV: %s", e)
        raise HTTPException(400, f"Invalid WAV file: {e}")

    logger.info("PCM extracted: %d bytes, %d Hz", len(pcm_data), sample_rate)

    # 2. Speech-to-Text
    transcript = await whisper_stt(pcm_data, sample_rate)
    if not transcript:
        logger.warning("Empty transcript")
        transcript = ""

    logger.info("Transcript: '%s'", transcript)

    # 2b. Server-side wake word check (skip if button mode)
    #     Whisper often misrecognizes "cervecero" as similar-sounding words,
    #     so we use fuzzy matching with known variants.
    trigger_found = False
    trigger_match = ""
    if not skip_trigger and TRIGGER_PHRASE:
        text_lower = transcript.lower()
        # Exact match first
        if TRIGGER_PHRASE.lower() in text_lower:
            trigger_found = True
            trigger_match = TRIGGER_PHRASE
        else:
            # Known Whisper misrecognitions of "cervecero"
            trigger_variants = [
                "cervecero", "cervecera", "cerveza", "cervece",
                "fervecero", "fervecera", "ferveza", "fervece",
                "hervecero", "hervecera", "herveza",
                "ser becero", "servecero", "servecera", "serbecero",
                "cervesero", "cervesera", "cerbecero", "cerbecera",
                "sirve zero", "sirve cero", "serve cero",
                "ser vecero", "cervec", "cerve ", "ferve",
            ]
            for variant in trigger_variants:
                if variant in text_lower:
                    trigger_found = True
                    trigger_match = variant
                    break

        if not trigger_found:
            logger.info("No trigger phrase '%s' in transcript '%s' — ignoring",
                       TRIGGER_PHRASE, transcript)
            return Response(status_code=204)
        else:
            logger.info("Trigger matched via '%s'", trigger_match)

    elif not skip_trigger:
        # No trigger phrase configured, pass through
        trigger_found = True

    # 2c. Strip trigger phrase/variant from the command before sending to Beergate
    clean_text = transcript
    if trigger_match:
        import re
        clean_text = re.sub(
            re.escape(trigger_match), "", transcript, count=1, flags=re.IGNORECASE
        ).strip()
    # Also strip common filler words
    for filler in [",", ".", "oye", "hey", "hola", "!"]:
        clean_text = clean_text.strip().removeprefix(filler).removesuffix(filler).strip()

    # If only the wake word was said (no actual command), prompt the user
    if not clean_text or clean_text.lower() == TRIGGER_PHRASE.lower():
        logger.info("Wake word only, no command — prompting user")
        response_text = "Dígame, ¿en qué puedo ayudarle?"
        wav_data, _ = await piper_tts(response_text)
        logger.info("TTS audio: %d bytes", len(wav_data))
        return Response(content=wav_data, media_type="audio/wav")

    logger.info("Clean command: '%s'", clean_text)

    # 3. Send to Beergate (regex-based first, then Claude fallback)
    if clean_text:
        response_text, confidence = await call_beergate_voice(clean_text)
        # If regex handler didn't understand, try Claude AI
        if confidence < 0.5:
            logger.info("Low confidence (%.1f) — trying Claude fallback", confidence)
            response_text = await call_claude(clean_text)
    else:
        response_text = "No he entendido lo que has dicho. ¿Puedes repetirlo?"

    # Limit response text to avoid huge TTS that overflows ESP32 buffer
    MAX_TTS_CHARS = 300
    if len(response_text) > MAX_TTS_CHARS:
        # Truncate at last sentence boundary
        truncated = response_text[:MAX_TTS_CHARS]
        for sep in ['. ', ', ', ' ']:
            idx = truncated.rfind(sep)
            if idx > MAX_TTS_CHARS // 2:
                truncated = truncated[:idx + 1]
                break
        response_text = truncated.rstrip() + '... y más.'
        logger.info("Response truncated to %d chars", len(response_text))

    logger.info("Beergate response: '%s'", response_text[:200])

    # 4. Text-to-Speech
    response_wav, _ = await piper_tts(response_text)

    logger.info("TTS audio: %d bytes", len(response_wav))

    return Response(
        content=response_wav,
        media_type="audio/wav",
    )


@app.post("/api/voice/stt")
async def speech_to_text(audio: UploadFile = File(...)):
    """Receive WAV audio, return transcript text."""
    wav_bytes = await audio.read()
    pcm_data, sample_rate = extract_pcm_from_wav(wav_bytes)
    transcript = await whisper_stt(pcm_data, sample_rate)
    return {"text": transcript}


@app.post("/api/voice/tts")
async def text_to_speech(text: str = Form(...)):
    """Receive text, return WAV audio."""
    wav_bytes, _ = await piper_tts(text)
    return Response(content=wav_bytes, media_type="audio/wav")


@app.get("/api/voice/voices")
async def list_voices():
    """List available Piper TTS voices."""
    return {
        "current": PIPER_VOICE,
        "available": [
            "es_ES-sharvard-medium",
            "es_ES-davefx-medium",
            "es_ES-mls_9972-low",
            "en_US-lessac-medium",
            "en_GB-northern_english_male-medium",
        ],
    }
