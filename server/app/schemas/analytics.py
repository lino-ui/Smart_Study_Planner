from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import date

class OverviewStats(BaseModel):
    total_hours: float
    current_streak: int
    completion_rate: int
    consistency_score: int

class HeatmapData(BaseModel):
    date: date
    count: int

class WeeklyHours(BaseModel):
    name: str
    hours: float

class SubjectPerformance(BaseModel):
    subject: str
    hours_spent: float
    progress_percentage: int
    color: str

class TrendData(BaseModel):
    date: str
    hours: float

class AnalyticsReport(BaseModel):
    overview: OverviewStats
    heatmap: List[HeatmapData]
    weekly_trend: List[WeeklyHours]
    subject_performance: List[SubjectPerformance]
    monthly_trend: List[TrendData]
    ai_insights: List[str]
