from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, JSON, Integer
from sqlalchemy.dialects.postgresql import DECIMAL
from app.core.database import Base

class Garment(Base):
    __tablename__ = "garments"

    id = Column(String, primary_key=True, server_default="gen_random_uuid()")
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=True)
    category = Column(String(30), nullable=False, index=True)
    sub_category = Column(String(30), nullable=True)
    original_image = Column(String, nullable=True)
    processed_image = Column(String, nullable=True)
    color_primary = Column(String(30), nullable=True)
    color_secondary = Column(String(30), nullable=True)
    material = Column(String(30), nullable=True)
    pattern = Column(String(30), nullable=True)
    fit_type = Column(String(20), nullable=True)
    style_tags = Column(JSON, default=list)
    season_tags = Column(JSON, default=list)
    brand = Column(String(50), nullable=True)
    ai_description = Column(String, nullable=True)
    is_public = Column(Boolean, default=False)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class SizeChart(Base):
    __tablename__ = "size_charts"

    id = Column(String, primary_key=True, server_default="gen_random_uuid()")
    garment_id = Column(String, ForeignKey("garments.id", ondelete="CASCADE"), nullable=False, index=True)
    size_system = Column(String(20), nullable=True)
    size_label = Column(String(20), nullable=False)
    chest = Column(DECIMAL(5, 1), nullable=True)
    shoulder = Column(DECIMAL(5, 1), nullable=True)
    sleeve_length = Column(DECIMAL(5, 1), nullable=True)
    total_length = Column(DECIMAL(5, 1), nullable=True)
    waist_circ = Column(DECIMAL(5, 1), nullable=True)
    hip_circ = Column(DECIMAL(5, 1), nullable=True)
    inseam = Column(DECIMAL(5, 1), nullable=True)
    thigh_circ = Column(DECIMAL(5, 1), nullable=True)
    front_rise = Column(DECIMAL(5, 1), nullable=True)
    foot_length = Column(DECIMAL(5, 1), nullable=True)
    foot_width = Column(DECIMAL(5, 1), nullable=True)
    custom_measurements = Column(JSON, nullable=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

class SizeRecommendation(Base):
    __tablename__ = "size_recommendations"

    id = Column(String, primary_key=True, server_default="gen_random_uuid()")
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    body_profile_id = Column(String, ForeignKey("body_profiles.id", ondelete="CASCADE"), nullable=False)
    garment_id = Column(String, ForeignKey("garments.id", ondelete="CASCADE"), nullable=False, index=True)
    recommended_size = Column(String(20), nullable=True)
    match_score = Column(DECIMAL(3, 2), nullable=True)
    fit_analysis = Column(JSON, nullable=True)
    alternative_sizes = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
