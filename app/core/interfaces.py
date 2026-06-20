from abc import ABC, abstractmethod
from typing import Any


class Transcriber(ABC):
    @abstractmethod
    def transcribe(self, audio_path: str) -> dict[str, Any]:
        raise NotImplementedError


class IncidentAnalyzer(ABC):
    @abstractmethod
    def analyze(self, segments: list[dict[str, Any]], full_text: str) -> list[dict[str, Any]]:
        raise NotImplementedError
