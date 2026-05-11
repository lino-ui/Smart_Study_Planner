from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Float
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base

class DifficultyLevel(str, enum.Enum):
    EASY = "Easy"
    MEDIUM = "Medium"
    HARD = "Hard"

class ChapterStatus(str, enum.Enum):
    NOT_STARTED = "Not Started"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, index=True, nullable=False)
    branch = Column(String, nullable=True)
    semester = Column(Integer, nullable=True)
    exam_date = Column(DateTime, nullable=True)
    total_hours = Column(Float, default=0.0)
    color = Column(String, default="#14B8A6") # Default teal
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", backref="subjects")
    chapters = relationship("Chapter", back_populates="subject", cascade="all, delete-orphan")

class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    difficulty = Column(Enum(DifficultyLevel), default=DifficultyLevel.MEDIUM)
    estimated_hours = Column(Float, default=1.0)
    completed_hours = Column(Float, default=0.0)
    status = Column(Enum(ChapterStatus), default=ChapterStatus.NOT_STARTED)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    subject = relationship("Subject", back_populates="chapters")
