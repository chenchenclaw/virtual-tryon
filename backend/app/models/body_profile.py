from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, DECIMAL
from app.core.database import Base

class BodyProfile(Base):
    __tablename__ = "body_profiles"

    id = Column(String, primary_key=True, server_default="gen_random_uuid()")
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    height_cm = Column(DECIMAL(5, 1), nullable=True)
    weight_kg = Column(DECIMAL(5, 1), nullable=True)
    shoulder_width = Column(DECIMAL(5, 1), nullable=True)
    chest_circ = Column(DECIMAL(5, 1), nullable=True)
    waist_circ = Column(DECIMAL(5, 1), nullable=True)
    hip_circ = Column(DECIMAL(5, 1), nullable=True)
    arm_length = Column(DECIMAL(5, 1), nullable=True)
    leg_length = Column(DECIMAL(5, 1), nullable=True)
    body_type = Column(String(20), nullable=True)
    front_photo_url = Column(String, nullable=True)
    side_photo_url = Column(String, nullable=True)
    body_description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
