from pydantic import BaseModel
from typing import Optional, List
from datetime import date

class HabitCreate(BaseModel):
    name: str
    description: Optional[str] = None

class HabitLogStatus(BaseModel):
    log_date: date
    completed: bool

class HabitResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    current_streak: int
    longest_streak: int
    is_completed_today: bool

    class Config:
        from_attributes = True
