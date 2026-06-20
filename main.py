"""
Точка входа FastAPI-приложения.

Запуск:
    uvicorn main:app --reload --host 0.0.0.0 --port 8000

Архитектурный переключатель IS_PRODUCTION находится в app/core/config.py.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.core.config import app_settings

app = FastAPI(title=app_settings.TITLE, version=app_settings.VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
