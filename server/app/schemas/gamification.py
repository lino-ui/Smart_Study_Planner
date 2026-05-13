from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class BadgeResponse(BaseModel):
    id: int
    badge_name: str
    badge_icon: str
    description: Optional[str] = None
    earned_at: datetime

    class Config:
        from_attributes = True

class GamificationStatsResponse(BaseModel):
    total_xp: int
    current_level: int
    current_streak: int
    longest_streak: int
    total_points: int
    xp_to_next_level: int
    progress_percentage: int
    badges: List[BadgeResponse] = []

    class Config:
        from_attributes = True

class ActivityLogRequest(BaseModel):
    activity_type: str  # e.g., "study_session", "chapter_completed"
    duration_minutes: Optional[int] = 0
