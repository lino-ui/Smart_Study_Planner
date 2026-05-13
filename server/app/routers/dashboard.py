from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func
from datetime import date, timedelta
import random

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.models.progress import StudyLog
from app.models.subject import Subject, Chapter, ChapterStatus
from app.models.timetable import TimetableSlot
from app.schemas.dashboard import (
    DashboardOverviewResponse, DashboardTaskItem, DashboardExamItem, DashboardProgressSnapshot
)
from app.services.gamification_service import get_or_create_stats, calculate_xp_for_level

router = APIRouter()

@router.get("/overview", response_model=DashboardOverviewResponse)
async def get_dashboard_overview(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    today = date.today()
    
    # 1. Gamification Stats
    gami_stats = await get_or_create_stats(db, current_user.id)
    current_level_xp = calculate_xp_for_level(gami_stats.current_level)
    next_level_xp = calculate_xp_for_level(gami_stats.current_level + 1)
    xp_in_level = gami_stats.total_xp - current_level_xp
    xp_needed = next_level_xp - current_level_xp
    xp_progress = int((xp_in_level / xp_needed) * 100) if xp_needed > 0 else 100
    
    # 2. Today's Studied Hours
    logs_result = await db.execute(
        select(func.sum(StudyLog.duration_minutes))
        .where(StudyLog.user_id == current_user.id, StudyLog.log_date == today)
    )
    studied_minutes_today = logs_result.scalar() or 0
    studied_hours_today = round(studied_minutes_today / 60.0, 1)

    # 3. Today's Timetable Tasks & Planned Hours
    # Need subjects loaded for color/name
    subjects_result = await db.execute(
        select(Subject)
        .options(selectinload(Subject.chapters))
        .where(Subject.user_id == current_user.id)
    )
    subjects = subjects_result.scalars().all()
    sub_dict = {s.id: s for s in subjects}
    chapter_dict = {c.id: c for s in subjects for c in s.chapters}
    
    timetable_result = await db.execute(
        select(TimetableSlot)
        .where(TimetableSlot.user_id == current_user.id, TimetableSlot.date == today)
        .order_by(TimetableSlot.start_time)
    )
    slots = timetable_result.scalars().all()
    
    today_tasks = []
    planned_minutes_today = 0
    for slot in slots:
        planned_minutes_today += slot.duration_minutes
        sub = sub_dict.get(slot.subject_id)
        chap = chapter_dict.get(slot.chapter_id)
        
        if sub and chap:
            today_tasks.append(DashboardTaskItem(
                id=slot.id,
                subject_name=sub.name,
                subject_color=sub.color,
                chapter_title=chap.title,
                start_time=slot.start_time.strftime("%H:%M") if slot.start_time else "TBD",
                duration_minutes=slot.duration_minutes,
                is_completed=chap.status == ChapterStatus.COMPLETED
            ))
            
    planned_hours_today = round(planned_minutes_today / 60.0, 1)

    # 4. Upcoming Exams
    exams = []
    for sub in subjects:
        if sub.exam_date and sub.exam_date >= today:
            days_left = (sub.exam_date - today).days
            exams.append(DashboardExamItem(
                subject_id=sub.id,
                subject_name=sub.name,
                subject_color=sub.color,
                exam_date=sub.exam_date,
                days_left=days_left
            ))
    # Sort by closest exam, take top 3
    exams.sort(key=lambda x: x.days_left)
    exams = exams[:3]

    # 5. Progress Snapshots (Top 4 subjects by estimated hours to show big picture)
    snapshots = []
    sorted_subjects = sorted(subjects, key=lambda x: sum(c.estimated_hours for c in x.chapters), reverse=True)[:4]
    
    for sub in sorted_subjects:
        sub_est = sum(c.estimated_hours for c in sub.chapters)
        sub_comp = sum(c.estimated_hours for c in sub.chapters if c.status == ChapterStatus.COMPLETED)
        prog = int((sub_comp / sub_est) * 100) if sub_est > 0 else 0
        snapshots.append(DashboardProgressSnapshot(
            subject_name=sub.name,
            subject_color=sub.color,
            progress_percentage=prog
        ))

    # 6. Motivation String
    motivations = [
        "Small steps every day lead to massive results.",
        "Focus on the process, not just the outcome.",
        "Your future self is thanking you right now.",
        "Consistency is the key to mastery.",
        "A clear mind and a calm environment is all you need."
    ]
    motivation = random.choice(motivations)
    
    if gami_stats.current_streak > 3:
        motivation = f"You are on a {gami_stats.current_streak}-day streak! Keep the momentum alive!"

    return DashboardOverviewResponse(
        user_name=current_user.full_name.split(' ')[0],
        current_level=gami_stats.current_level,
        current_streak=gami_stats.current_streak,
        xp_progress_percentage=xp_progress,
        hours_studied_today=studied_hours_today,
        planned_hours_today=planned_hours_today,
        today_tasks=today_tasks,
        upcoming_exams=exams,
        progress_snapshot=snapshots,
        daily_motivation=motivation
    )
