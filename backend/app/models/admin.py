from datetime import datetime
from sqlalchemy import Column, String, DateTime
from app.core.database import Base

class Admin(Base):
    __tablename__ = "admins"

    id = Column(String, primary_key=True, server_default="gen_random_uuid()")
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String(20), default="admin")  # super_admin / admin / viewer
    created_at = Column(DateTime, default=datetime.utcnow)
