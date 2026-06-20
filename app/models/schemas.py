from pydantic import BaseModel


class Segment(BaseModel):
    start: float
    end: float
    text: str


class Incident(BaseModel):
    id: str
    type: str
    timestamp: str
    risk_score: int
    title: str
    summary: str
    severity: str


class IncidentSummary(BaseModel):
    total: int
    critical: int
    high: int
    medium: int
    low: int


class AnalyzeResponse(BaseModel):
    status: str
    mode: str
    filename: str | None = None
    transcript: str
    segments: list[Segment]
    incidents: list[Incident]
    summary: IncidentSummary
