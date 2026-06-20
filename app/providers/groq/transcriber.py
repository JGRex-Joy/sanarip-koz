from typing import Any

from groq import Groq

from app.core.config import groq_settings
from app.core.interfaces import Transcriber


class GroqTranscriber(Transcriber):
    def __init__(self) -> None:
        self._client = Groq(api_key=groq_settings.API_KEY)

    def transcribe(self, audio_path: str) -> dict[str, Any]:
        with open(audio_path, "rb") as f:
            response = self._client.audio.transcriptions.create(
                file=f,
                model=groq_settings.WHISPER_MODEL,
                response_format="verbose_json",
                timestamp_granularities=["segment"],
                language="ru",
            )

        segments = []
        for seg in (response.segments or []):
            if isinstance(seg, dict):
                segments.append({
                    "start": seg.get("start", 0),
                    "end": seg.get("end", 0),
                    "text": seg.get("text", ""),
                })
            else:
                segments.append({"start": seg.start, "end": seg.end, "text": seg.text})

        return {"text": response.text, "segments": segments}
