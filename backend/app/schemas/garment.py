from pydantic import BaseModel

class GarmentCreate(BaseModel):
    name: str | None = None
    category: str
    sub_category: str | None = None
    original_image: str | None = None
    processed_image: str | None = None
    color_primary: str | None = None
    color_secondary: str | None = None
    material: str | None = None
    pattern: str | None = None
    fit_type: str | None = None
    style_tags: list[str] = []
    season_tags: list[str] = []
    brand: str | None = None
    ai_description: str | None = None

class SizeChartEntry(BaseModel):
    size_label: str
    size_system: str | None = "asian"
    chest: float | None = None
    shoulder: float | None = None
    sleeve_length: float | None = None
    total_length: float | None = None
    waist_circ: float | None = None
    hip_circ: float | None = None
    inseam: float | None = None
    thigh_circ: float | None = None
    front_rise: float | None = None
    foot_length: float | None = None
    foot_width: float | None = None
    sort_order: int = 0

class SizeChartRequest(BaseModel):
    garment_id: str
    sizes: list[SizeChartEntry]

class GarmentResponse(BaseModel):
    id: str
    user_id: str
    name: str | None
    category: str
    fit_type: str | None
    color_primary: str | None
    material: str | None
    pattern: str | None
    original_image: str | None
    processed_image: str | None
    ai_description: str | None
    created_at: str | None

    class Config:
        from_attributes = True
