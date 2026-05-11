from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, time, datetime
from app.schemas.subject import SubjectResponse, ChapterResponse

class StudyLogBase(BaseModel):
    subject_id: int
    chapter_id: Optional[int] = None
    log_date: date
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    duration_minutes: int = Field(..., gt=0)
    topics_covered: Optional[str] = None
    notes: Optional[str] = None
    mood: Optional[int] = Field(None, ge=1, le=5)
    energy_level: Optional[int] = Field(None, ge=1, le=5)

class StudyLogCreate(StudyLogBase):
    pass

class StudyLogUpdate(BaseModel):
    subject_id: Optional[int] = None
    chapter_id: Optional[int] = None
    log_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    duration_minutes: Optional[int] = Field(None, gt=0)
    topics_covered: Optional[str] = None
    notes: Optional[str] = None
    mood: Optional[int] = Field(None, ge=1, le=5)
    energy_level: Optional[int] = Field(None, ge=1, le=5)

class StudyLogResponse(StudyLogBase):
    id: int
    user_id: int
    created_at: datetime
    
    subject_name: Optional[str] = None
    subject_color: Optional[str] = None
    chapter_title: Optional[str] = None

    class Config:
        from_attributes = True

class DailyProgressSummary(BaseModel):
    log_date: date
    total_minutes: int
    logs_count: int

class SubjectProgressResponse(BaseModel):
    subject_id: int
    subject_name: str
    color: str
    total_estimated_hours: float
    total_completed_hours: float
    progress_percentage: int
