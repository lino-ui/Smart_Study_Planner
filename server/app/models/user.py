from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Integer, Column
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    branch = Column(String, nullable=True)
    semester = Column(Integer, nullable=True)
    daily_study_hours = Column(Integer, default=6)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    avatar_url = Column(String, nullable=True)
