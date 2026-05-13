from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class DashboardTaskItem(BaseModel):
    id: int
    subject_name: str
    subject_color: str
    chapter_title: str
    start_time: str
    duration_minutes: int
    is_completed: bool

class DashboardExamItem(BaseModel):
    subject_id: int
    subject_name: str
    subject_color: str
    exam_date: date
    days_left: int

class DashboardProgressSnapshot(BaseModel):
    subject_name: str
    subject_color: str
    progress_percentage: int

class DashboardOverviewResponse(BaseModel):
    user_name: str
    
    # Gamification
    current_level: int
    current_streak: int
    xp_progress_percentage: int
    
    # Today's Progress
    hours_studied_today: float
    planned_hours_today: float
    
    # Main content
    today_tasks: List[DashboardTaskItem]
    upcoming_exams: List[DashboardExamItem]
    progress_snapshot: List[DashboardProgressSnapshot]
    
    # Motivation
    daily_motivation: str
