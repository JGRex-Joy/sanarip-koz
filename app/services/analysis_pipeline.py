import os
import tempfile
from typing import Any

from app.core.config import IS_PRODUCTION
from app.services.audio_extraction import extract_audio
from app.services.provider_factory import get_analyzer, get_transcriber
from app.services.technical_anomalies import detect_technical_anomalies


def run_analysis(video_bytes: bytes, filename: str | None) -> dict[str, Any]:
    with tempfile.TemporaryDirectory() as tmpdir:
        video_path = os.path.join(tmpdir, "input_video")
        audio_path = os.path.join(tmpdir, "temp.mp3")

        with open(video_path, "wb") as f:
            f.write(video_bytes)

        extract_audio(video_path, audio_path)

        transcriber = get_transcriber()
        transcription = transcriber.transcribe(audio_path)

        analyzer = get_analyzer()
        speech_incidents = analyzer.analyze(
            segments=transcription.get("segments", []),
            full_text=transcription.get("text", ""),
        )

        tech_incidents = detect_technical_anomalies(video_path)

        all_incidents = speech_incidents + tech_incidents
        for i, inc in enumerate(all_incidents):
            if not inc.get("id"):
                inc["id"] = f"inc_{i + 1:03d}"

        return {
            "status": "success",
            "mode": "PRODUCTION" if IS_PRODUCTION else "DEMO",
            "filename": filename,
            "transcript": transcription.get("text", ""),
            "segments": transcription.get("segments", []),
            "incidents": all_incidents,
            "summary": _build_summary(all_incidents),
        }


def _build_summary(incidents: list[dict[str, Any]]) -> dict[str, int]:
    return {
        "total": len(incidents),
        "critical": sum(1 for i in incidents if i.get("severity") == "CRITICAL"),
        "high": sum(1 for i in incidents if i.get("severity") == "HIGH"),
        "medium": sum(1 for i in incidents if i.get("severity") == "MEDIUM"),
        "low": sum(1 for i in incidents if i.get("severity") == "LOW"),
    }
