from typing import Any

import httpx

from app.core.config import ollama_settings
from app.core.interfaces import Transcriber


class OllamaTranscriber(Transcriber):
    def __init__(self) -> None:
        self._base_url = ollama_settings.BASE_URL
        self._model = ollama_settings.WHISPER_MODEL
        self._timeout = ollama_settings.REQUEST_TIMEOUT

    def transcribe(self, audio_path: str) -> dict[str, Any]:
        with open(audio_path, "rb") as f:
            audio_bytes = f.read()

        response = httpx.post(
            f"{self._base_url}/api/transcribe",
            json={
                "model": self._model,
                "audio": audio_bytes.hex(),
                "language": "ru",
            },
            timeout=self._timeout,
        )
        response.raise_for_status()
        data = response.json()

        return {
            "text": data.get("text", ""),
            "segments": data.get("segments", []),
        }
