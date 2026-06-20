from fastapi import APIRouter, File, HTTPException, UploadFile

from app.core.config import IS_PRODUCTION
from app.services.analysis_pipeline import run_analysis
from app.services.audio_extraction import AudioExtractionError

router = APIRouter()


@router.get("/")
def health() -> dict:
    mode = "PRODUCTION (On-Premise Ollama)" if IS_PRODUCTION else "DEMO (Groq API)"
    return {"status": "ok", "mode": mode, "service": "Санарип Көз API"}


@router.post("/api/analyze")
async def analyze_video(file: UploadFile = File(...)) -> dict:
    video_bytes = await file.read()

    try:
        result = run_analysis(video_bytes, file.filename)
    except AudioExtractionError as e:
        raise HTTPException(status_code=422, detail=f"Ошибка извлечения аудио: {e}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Ошибка анализа: {e}")

    return result
