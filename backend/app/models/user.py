from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, JSON
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, server_default="gen_random_uuid()")
    phone = Column(String(20), unique=True, nullable=True)
    email = Column(String(255), unique=True, nullable=True)
    password_hash = Column(String, nullable=True)
    nickname = Column(String(50), nullable=True)
    avatar_url = Column(String, nullable=True)
    gender = Column(String(10), nullable=True)
    birth_year = Column(Integer, nullable=True)
    style_preferences = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
