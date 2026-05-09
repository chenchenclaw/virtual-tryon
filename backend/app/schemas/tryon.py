from pydantic import BaseModel

class TryonRequest(BaseModel):
    body_profile_id: str | None = None
    garment_ids: list[str]
    scene: str = "studio"
    pose: str = "front_standing"
    quality: str = "high"
    size_overrides: dict[str, str] | None = None

class TryonResult(BaseModel):
    task_id: str
    status: str
    result_urls: list[str]
    quality_score: float | None = None

class TryonStatusResponse(BaseModel):
    task_id: str
    status: str
    result_urls: list[str]
    quality_score: float | None
    retry_count: int
    processing_time_ms: int | None
    error_message: str | None
    created_at: str | None
    completed_at: str | None
