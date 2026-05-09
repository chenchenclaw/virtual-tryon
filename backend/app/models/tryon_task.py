from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, JSON
from sqlalchemy import DECIMAL
from app.core.database import Base

class TryonTask(Base):
    __tablename__ = "tryon_tasks"

    id = Column(String, primary_key=True, server_default="gen_random_uuid()")
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    body_profile_id = Column(String, ForeignKey("body_profiles.id", ondelete="SET NULL"), nullable=True)
    garment_ids = Column(JSON, default=list)
    scene = Column(String(30), nullable=True)
    pose_type = Column(String(30), nullable=True)
    status = Column(String(20), default="pending", index=True)
    result_urls = Column(JSON, default=list)
    prompt_used = Column(String, nullable=True)
    api_model = Column(String(50), nullable=True)
    api_calls_count = Column(Integer, default=0)
    processing_time_ms = Column(Integer, nullable=True)
    quality_score = Column(DECIMAL(3, 2), nullable=True)
    retry_count = Column(Integer, default=0)
    error_message = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
