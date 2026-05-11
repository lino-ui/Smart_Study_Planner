from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func
from typing import List
from datetime import date, timedelta

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.models.progress import StudyLog
from app.models.subject import Subject, Chapter, ChapterStatus
from app.schemas.progress import (
    StudyLogCreate, StudyLogUpdate, StudyLogResponse, 
    DailyProgressSummary, SubjectProgressResponse
)

router = APIRouter()

@router.post("/log", response_model=StudyLogResponse, status_code=status.HTTP_201_CREATED)
async def log_study_session(
    log_in: StudyLogCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify subject
    result = await db.execute(select(Subject).where(Subject.id == log_in.subject_id, Subject.user_id == current_user.id))
    subject = result.scalars().first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    db_log = StudyLog(**log_in.model_dump(), user_id=current_user.id)
    db.add(db_log)
    
    # If chapter is specified, we should auto-increment completed_hours
    if log_in.chapter_id:
        ch_result = await db.execute(select(Chapter).where(Chapter.id == log_in.chapter_id))
        chapter = ch_result.scalars().first()
        if chapter:
            hours_added = log_in.duration_minutes / 60.0
            chapter.completed_hours += hours_added
            if chapter.status == ChapterStatus.NOT_STARTED:
                chapter.status = ChapterStatus.IN_PROGRESS
            # If completed_hours >= estimated_hours, we might auto-complete or let the user do it manually
            db.add(chapter)

    await db.commit()
    await db.refresh(db_log)

    # Attach joined data for response
    response_dict = db_log.__dict__.copy()
    response_dict["subject_name"] = subject.name
    response_dict["subject_color"] = subject.color
    if log_in.chapter_id and 'chapter' in locals() and chapter:
        response_dict["chapter_title"] = chapter.title

    return response_dict

@router.get("/recent", response_model=List[StudyLogResponse])
async def get_recent_logs(
    limit: int = 10,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(StudyLog)
        .options(selectinload(StudyLog.subject), selectinload(StudyLog.chapter))
        .where(StudyLog.user_id == current_user.id)
        .order_by(StudyLog.log_date.desc(), StudyLog.created_at.desc())
        .limit(limit)
    )
    logs = result.scalars().all()
    
    response_logs = []
    for log in logs:
        log_dict = log.__dict__.copy()
        if log.subject:
            log_dict["subject_name"] = log.subject.name
            log_dict["subject_color"] = log.subject.color
        if log.chapter:
            log_dict["chapter_title"] = log.chapter.title
        response_logs.append(log_dict)
        
    return response_logs

@router.get("/weekly", response_model=List[DailyProgressSummary])
async def get_weekly_progress(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns the study minutes per day for the last 7 days to fuel the Recharts bar chart.
    """
    end_date = date.today()
    start_date = end_date - timedelta(days=6)
    
    result = await db.execute(
        select(StudyLog.log_date, func.sum(StudyLog.duration_minutes).label('total_minutes'), func.count(StudyLog.id).label('logs_count'))
        .where(StudyLog.user_id == current_user.id, StudyLog.log_date >= start_date, StudyLog.log_date <= end_date)
        .group_by(StudyLog.log_date)
    )
    
    # Fill in missing days with 0
    records = {row.log_date: {"total_minutes": row.total_minutes, "logs_count": row.logs_count} for row in result.all()}
    
    weekly_data = []
    for i in range(7):
        current_day = start_date + timedelta(days=i)
        data = records.get(current_day, {"total_minutes": 0, "logs_count": 0})
        weekly_data.append(DailyProgressSummary(
            log_date=current_day,
            total_minutes=data["total_minutes"],
            logs_count=data["logs_count"]
        ))
        
    return weekly_data

@router.get("/overview", response_model=dict)
async def get_progress_overview(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns overall statistics: total study hours, global progress %, and current streak.
    """
    # 1. Total Study Hours
    total_result = await db.execute(
        select(func.sum(StudyLog.duration_minutes))
        .where(StudyLog.user_id == current_user.id)
    )
    total_minutes = total_result.scalar() or 0
    total_hours = total_minutes / 60.0

    # 2. Global Syllabus Progress
    subjects_result = await db.execute(
        select(Subject)
        .options(selectinload(Subject.chapters))
        .where(Subject.user_id == current_user.id)
    )
    subjects = subjects_result.scalars().all()
    
    total_est = 0
    total_comp = 0
    subject_details = []
    
    for sub in subjects:
        sub_est = sum(c.estimated_hours for c in sub.chapters)
        sub_comp = sum(c.estimated_hours for c in sub.chapters if c.status == ChapterStatus.COMPLETED)
        
        total_est += sub_est
        total_comp += sub_comp
        
        percentage = int((sub_comp / sub_est) * 100) if sub_est > 0 else 0
        subject_details.append(SubjectProgressResponse(
            subject_id=sub.id,
            subject_name=sub.name,
            color=sub.color,
            total_estimated_hours=sub_est,
            total_completed_hours=sub_comp,
            progress_percentage=percentage
        ))
        
    global_percentage = int((total_comp / total_est) * 100) if total_est > 0 else 0

    # 3. Calculate Streak (consecutive days of studying, starting from today or yesterday)
    streak = 0
    logs_result = await db.execute(
        select(StudyLog.log_date)
        .where(StudyLog.user_id == current_user.id)
        .group_by(StudyLog.log_date)
        .order_by(StudyLog.log_date.desc())
    )
    dates_studied = [row.log_date for row in logs_result.all()]
    
    if dates_studied:
        current_date = date.today()
        # If didn't study today, check if studied yesterday. If neither, streak is 0.
        if dates_studied[0] == current_date:
            streak = 1
            check_date = current_date - timedelta(days=1)
            idx = 1
        elif dates_studied[0] == current_date - timedelta(days=1):
            streak = 1
            check_date = current_date - timedelta(days=2)
            idx = 1
        else:
            check_date = None # Streak broken
            
        if check_date:
            while idx < len(dates_studied) and dates_studied[idx] == check_date:
                streak += 1
                check_date -= timedelta(days=1)
                idx += 1

    return {
        "total_study_hours": round(total_hours, 1),
        "global_progress_percentage": global_percentage,
        "current_streak": streak,
        "subject_progress": subject_details
    }
