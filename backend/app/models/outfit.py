from datetime import datetime
from sqlalchemy import Column, String, Boolean, Integer, DateTime, ForeignKey, JSON
from app.core.database import Base

class Outfit(Base):
    __tablename__ = "outfits"

    id = Column(String, primary_key=True, server_default="gen_random_uuid()")
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=True)
    description = Column(String, nullable=True)
    garment_ids = Column(JSON, default=list)
    tryon_task_id = Column(String, nullable=True)
    cover_image = Column(String, nullable=True)
    scene = Column(String(30), nullable=True)
    tags = Column(JSON, default=list)
    is_public = Column(Boolean, default=False)
    like_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
