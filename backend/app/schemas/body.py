from pydantic import BaseModel

class BodyProfileCreate(BaseModel):
    height_cm: float | None = None
    weight_kg: float | None = None
    shoulder_width: float | None = None
    chest_circ: float | None = None
    waist_circ: float | None = None
    hip_circ: float | None = None
    arm_length: float | None = None
    leg_length: float | None = None
    body_type: str | None = None
    body_description: str | None = None

class BodyProfileResponse(BaseModel):
    id: str
    user_id: str
    height_cm: float | None
    weight_kg: float | None
    shoulder_width: float | None
    chest_circ: float | None
    waist_circ: float | None
    hip_circ: float | None
    arm_length: float | None
    leg_length: float | None
    body_type: str | None
    front_photo_url: str | None
    side_photo_url: str | None
    body_description: str | None

    class Config:
        from_attributes = True
