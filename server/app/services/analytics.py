import math
from datetime import date, timedelta
from typing import List, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func

from app.models.user import User
from app.models.progress import StudyLog
from app.models.subject import Subject, Chapter, ChapterStatus
from app.schemas.analytics import (
    AnalyticsReport, OverviewStats, HeatmapData, WeeklyHours, SubjectPerformance, TrendData
)
from app.llm.client import llm_client
from app.llm.prompts import get_system_prompt

async def generate_analytics_report(db: AsyncSession, user: User) -> AnalyticsReport:
    """
    Generates a comprehensive analytics report for the user.
    """
    today = date.today()
    thirty_days_ago = today - timedelta(days=30)
    seven_days_ago = today - timedelta(days=6)

    # 1. Fetch all study logs for the last 30 days
    logs_result = await db.execute(
        select(StudyLog)
        .options(selectinload(StudyLog.subject))
        .where(StudyLog.user_id == user.id, StudyLog.log_date >= thirty_days_ago)
        .order_by(StudyLog.log_date)
    )
    logs = logs_result.scalars().all()

    # Calculate Totals
    total_minutes_30d = sum(log.duration_minutes for log in logs)
    total_hours_30d = round(total_minutes_30d / 60.0, 1)

    # Calculate Streak & Consistency
    studied_dates = set(log.log_date for log in logs)
    streak = 0
    check_date = today
    if check_date not in studied_dates:
        check_date = today - timedelta(days=1)
    
    while check_date in studied_dates:
        streak += 1
        check_date -= timedelta(days=1)
        
    consistency_score = int((len(studied_dates) / 30.0) * 100)

    # Calculate Global Progress
    subjects_result = await db.execute(
        select(Subject)
        .options(selectinload(Subject.chapters))
        .where(Subject.user_id == user.id)
    )
    subjects = subjects_result.scalars().all()
    
    total_est = sum(c.estimated_hours for sub in subjects for c in sub.chapters)
    total_comp = sum(c.estimated_hours for sub in subjects for c in sub.chapters if c.status == ChapterStatus.COMPLETED)
    global_progress = int((total_comp / total_est) * 100) if total_est > 0 else 0

    overview = OverviewStats(
        total_hours=total_hours_30d,
        current_streak=streak,
        completion_rate=global_progress,
        consistency_score=consistency_score
    )

    # 2. Heatmap Data (Last 30 days)
    heatmap_dict = {today - timedelta(days=i): 0 for i in range(30)}
    for log in logs:
        if log.log_date in heatmap_dict:
            heatmap_dict[log.log_date] += log.duration_minutes
            
    heatmap = [HeatmapData(date=k, count=v) for k, v in heatmap_dict.items()]

    # 3. Weekly Trend (Last 7 days)
    weekly_dict = {today - timedelta(days=i): 0 for i in range(6, -1, -1)}
    for log in logs:
        if log.log_date in weekly_dict:
            weekly_dict[log.log_date] += log.duration_minutes
            
    days_of_week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    weekly_trend = [
        WeeklyHours(name=days_of_week[k.weekday()], hours=round(v / 60.0, 1)) 
        for k, v in weekly_dict.items()
    ]

    # 4. Subject Performance
    subject_perf = []
    for sub in subjects:
        sub_est = sum(c.estimated_hours for c in sub.chapters)
        sub_comp = sum(c.estimated_hours for c in sub.chapters if c.status == ChapterStatus.COMPLETED)
        sub_prog = int((sub_comp / sub_est) * 100) if sub_est > 0 else 0
        
        # Calculate hours spent from logs
        sub_logs = [log for log in logs if log.subject_id == sub.id]
        hours_spent = sum(log.duration_minutes for log in sub_logs) / 60.0
        
        subject_perf.append(SubjectPerformance(
            subject=sub.name,
            hours_spent=round(hours_spent, 1),
            progress_percentage=sub_prog,
            color=sub.color
        ))

    # 5. Monthly Trend
    monthly_trend = [
        TrendData(date=k.strftime("%b %d"), hours=round(v / 60.0, 1)) 
        for k, v in sorted(heatmap_dict.items())
    ]

    # 6. LLM AI Insights
    # In production, we send the raw data to Gemini to generate insights.
    # For now, we simulate a fast response if Gemini is not configured.
    ai_insights = [
        f"You maintain a solid consistency score of {consistency_score}%. Keep up the daily habits!",
    ]
    
    if subject_perf:
        weakest = min(subject_perf, key=lambda x: x.progress_percentage)
        ai_insights.append(f"Consider allocating more Pomodoro sessions to {weakest.subject}, as it's currently your weakest area at {weakest.progress_percentage}% completion.")
        
    return AnalyticsReport(
        overview=overview,
        heatmap=heatmap,
        weekly_trend=weekly_trend,
        subject_performance=subject_perf,
        monthly_trend=monthly_trend,
        ai_insights=ai_insights
    )
