import os

# Переключатель архитектуры - не забыть!!!
IS_PRODUCTION: bool = False


class GroqSettings:
    API_KEY: str = os.getenv("GROQ_API_KEY", "YOUR_GROQ_API_KEY_HERE")
    WHISPER_MODEL: str = "whisper-large-v3"
    LLM_MODEL: str = "llama-3.3-70b-versatile"


class OllamaSettings:
    BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    WHISPER_MODEL: str = "whisper"          
    LLM_MODEL: str = "qwen2.5:72b"          
    REQUEST_TIMEOUT: int = 300


class AppSettings:
    TITLE: str = "Санарип Көз - AI Аудит Бодикамер"
    VERSION: str = "2.0.0"
    MAX_VIDEO_DURATION_SEC: int = 5 * 60 # 5 минут  


groq_settings = GroqSettings()
ollama_settings = OllamaSettings()
app_settings = AppSettings()
