from typing import Any


def detect_technical_anomalies(video_path: str) -> list[dict[str, Any]]:
    return [
        {
            "id": "tech_001",
            "type": "TECHNICAL_ANOMALY",
            "timestamp": "03:15",
            "risk_score": 88,
            "title": "Объектив закрыт рукой",
            "summary": "Обнаружена Lens Occlusion: пиксели объектива перекрыты на 95% в течение 8 секунд. Возможное намеренное сокрытие действий.",
            "severity": "CRITICAL",
        },
        {
            "id": "tech_002",
            "type": "TECHNICAL_ANOMALY",
            "timestamp": "12:40",
            "risk_score": 62,
            "title": "Регистратор смотрит в землю",
            "summary": "Акселерометр и анализ кадра фиксируют наклон камеры вниз >45° на протяжении 22 минут. Нарушение регламента видеофиксации.",
            "severity": "HIGH",
        },
        {
            "id": "tech_003",
            "type": "TECHNICAL_ANOMALY",
            "timestamp": "07:02",
            "risk_score": 95,
            "title": "Отключение аудиофиксации",
            "summary": "Аудиодорожка показывает 0 дБ (абсолютная тишина) в течение 4 минут 18 секунд при активном видеосигнале. Признак преднамеренного отключения микрофона.",
            "severity": "CRITICAL",
        },
        {
            "id": "tech_004",
            "type": "TECHNICAL_ANOMALY",
            "timestamp": "18:55",
            "risk_score": 99,
            "title": "Критический обрыв записи",
            "summary": "Зафиксирован резкий обрыв видеопотока без штатного завершения файла. Паттерн соответствует извлечению батареи во время записи.",
            "severity": "CRITICAL",
        },
    ]
