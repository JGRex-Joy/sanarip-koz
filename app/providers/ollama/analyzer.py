from typing import Any

import httpx

from app.core.config import ollama_settings
from app.core.interfaces import IncidentAnalyzer
from app.services.prompts import ANALYSIS_SYSTEM_PROMPT, build_user_prompt
from app.providers.groq.analyzer import _parse_incidents_json


class OllamaAnalyzer(IncidentAnalyzer):
    def __init__(self) -> None:
        self._base_url = ollama_settings.BASE_URL
        self._model = ollama_settings.LLM_MODEL
        self._timeout = ollama_settings.REQUEST_TIMEOUT

    def analyze(self, segments: list[dict[str, Any]], full_text: str) -> list[dict[str, Any]]:
        user_prompt = build_user_prompt(segments, full_text)

        response = httpx.post(
            f"{self._base_url}/api/chat",
            json={
                "model": self._model,
                "messages": [
                    {"role": "system", "content": ANALYSIS_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                "stream": False,
                "options": {"temperature": 0.1},
            },
            timeout=self._timeout,
        )
        response.raise_for_status()
        raw = response.json()["message"]["content"].strip()
        return _parse_incidents_json(raw)
