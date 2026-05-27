from datetime import datetime, date, time
from sqlalchemy import Column, Integer, String, Date, Time, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class StudyLog(Base):
    __tablename__ = "study_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    chapter_id = Column(Integer, ForeignKey("chapters.id", ondelete="SET NULL"), nullable=True)
    
    log_date = Column(Date, nullable=False, default=date.today, index=True)
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    duration_minutes = Column(Integer, nullable=False)
    
    topics_covered = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    mood = Column(Integer, nullable=True) # 1-5 scale
    energy_level = Column(Integer, nullable=True) # 1-5 scale
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User")
    subject = relationship("Subject")
    chapter = relationship("Chapter")
