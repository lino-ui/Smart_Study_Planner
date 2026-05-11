from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, time, datetime
from app.schemas.subject import SubjectResponse, ChapterResponse

class DailyTaskBase(BaseModel):
    subject_id: int
    chapter_id: Optional[int] = None
    task_date: date
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    duration_minutes: int
    title: str
    is_completed: bool = False

class DailyTaskCreate(DailyTaskBase):
    pass

class DailyTaskUpdate(BaseModel):
    task_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    duration_minutes: Optional[int] = None
    title: Optional[str] = None
    is_completed: Optional[bool] = None

class DailyTaskResponse(DailyTaskBase):
    id: int
    user_id: int
    priority_score: int
    created_at: datetime
    
    # We will nest minimal info to display on frontend
    subject_color: Optional[str] = None
    subject_name: Optional[str] = None

    class Config:
        from_attributes = True

class GenerateTimetableRequest(BaseModel):
    start_date: date
    days_to_generate: int = Field(7, ge=1, le=14)
    regenerate: bool = False
