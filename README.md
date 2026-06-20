# Санарип Көз - Backend 

## Структура проекта

```
backend/
├── main.py                          # Точка входа FastAPI
├── requirements.txt
└── app/
    ├── core/
    │   ├── config.py                # IS_PRODUCTION + настройки Groq/Ollama
    │   └── interfaces.py            # Абстракции Transcriber, IncidentAnalyzer
    │
    ├── providers/                   # Реализации инференс-провайдеров
    │   ├── groq/                    # ДЕМО-контур: удалённый Groq API
    │   │   ├── transcriber.py       # GroqTranscriber  (Whisper-large-v3)
    │   │   └── analyzer.py          # GroqAnalyzer     (Llama-3.3-70b)
    │   │
    │   └── ollama/                  # PRODUCTION-контур: On-Premise МВД
    │       ├── transcriber.py       # OllamaTranscriber (локальный Whisper)
    │       └── analyzer.py          # OllamaAnalyzer    (Qwen2.5-72b)
    │
    ├── services/                    # Бизнес-логика, не зависящая от провайдера
    │   ├── provider_factory.py      # Выбор Groq/Ollama по IS_PRODUCTION
    │   ├── analysis_pipeline.py     # Оркестрация: ffmpeg → STT → LLM → ответ
    │   ├── audio_extraction.py      # ffmpeg-обёртка
    │   ├── technical_anomalies.py   # CV-аномалии (заглушка под OpenCV)
    │   └── prompts.py               # Промпты — общие для Groq и Ollama
    │
    ├── models/
    │   └── schemas.py               # Pydantic-схемы ответа API
    │
    └── api/
        └── routes.py                # POST /api/analyze, GET /
```

## Архитектурный принцип

Все компоненты разделены на независимые слои:

| Слой | Отвечает за | Знает о провайдере? |
|------|-------------|----------------------|
| `api/` | HTTP, валидация запроса | Нет |
| `services/` | Бизнес-логика, оркестрация | Нет (работает через интерфейсы) |
| `providers/` | Конкретные реализации (Groq, Ollama) | Да — это и есть провайдер |
| `core/` | Конфигурация, контракты | — |

Сервисный слой (`analysis_pipeline.py`) ничего не знает о том, Groq используется
или Ollama - он работает с абстракциями `Transcriber` и `IncidentAnalyzer`
из `core/interfaces.py`. Конкретную реализацию подставляет `provider_factory.py`
на основе одного флага.

## Переключение Demo / Production

Единственное место, которое нужно поменять — `app/core/config.py`:

```python
IS_PRODUCTION = False   # Demo: Groq API (по умолчанию, для хакатона)
IS_PRODUCTION = True    # Production: локальный Ollama внутри периметра МВД
```

При `True` `provider_factory.py` импортирует и инстанцирует
`OllamaTranscriber` / `OllamaAnalyzer` вместо Groq-версий. Промпты при этом
не меняются — `services/prompts.py` используется обоими контурами, чтобы
поведение модели было идентичным в демо- и продакшен-режимах.

## Запуск

```bash
pip install -r requirements.txt
export GROQ_API_KEY="gsk_..."
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Документация API: http://localhost:8000/docs
