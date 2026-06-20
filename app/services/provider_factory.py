from app.core.config import IS_PRODUCTION
from app.core.interfaces import IncidentAnalyzer, Transcriber


def get_transcriber() -> Transcriber:
    if IS_PRODUCTION:
        from app.providers.ollama.transcriber import OllamaTranscriber
        return OllamaTranscriber()

    from app.providers.groq.transcriber import GroqTranscriber
    return GroqTranscriber()


def get_analyzer() -> IncidentAnalyzer:
    if IS_PRODUCTION:
        from app.providers.ollama.analyzer import OllamaAnalyzer
        return OllamaAnalyzer()

    from app.providers.groq.analyzer import GroqAnalyzer
    return GroqAnalyzer()
