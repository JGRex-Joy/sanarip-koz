import json
from typing import Any

from groq import Groq

from app.core.config import groq_settings
from app.core.interfaces import IncidentAnalyzer
from app.services.prompts import ANALYSIS_SYSTEM_PROMPT, build_user_prompt


class GroqAnalyzer(IncidentAnalyzer):
    def __init__(self) -> None:
        self._client = Groq(api_key=groq_settings.API_KEY)

    def analyze(self, segments: list[dict[str, Any]], full_text: str) -> list[dict[str, Any]]:
        user_prompt = build_user_prompt(segments, full_text)

        response = self._client.chat.completions.create(
            model=groq_settings.LLM_MODEL,
            messages=[
                {"role": "system", "content": ANALYSIS_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.1,
            max_tokens=2000,
        )
        raw = response.choices[0].message.content.strip()
        return _parse_incidents_json(raw)


def _parse_incidents_json(raw: str) -> list[dict[str, Any]]:
    try:
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        incidents = json.loads(raw)
        return incidents if isinstance(incidents, list) else []
    except Exception:
        return []
