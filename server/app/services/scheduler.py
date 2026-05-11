import math
from datetime import date, timedelta
from typing import List, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models.user import User
from app.models.subject import Subject, Chapter, ChapterStatus
from app.models.timetable import DailyTask

async def generate_timetable(
    db: AsyncSession, 
    user: User, 
    start_date: date, 
    days_to_generate: int,
    regenerate: bool = False
) -> List[DailyTask]:
    """
    Core Smart Scheduler Algorithm
    
    1. Exam Proximity Score: Closer exam = higher weight.
    2. Subject Difficulty: Hard = 3, Medium = 2, Easy = 1.
    3. Remaining Syllabus: Chapters not started/in progress vs total.
    4. Daily Available Hours: Distribute `user.daily_study_hours` into slots based on `user.pomodoro_length_minutes`.
    """
    
    if regenerate:
        # Delete future tasks within the generation window
        end_date = start_date + timedelta(days=days_to_generate - 1)
        # Note: In a production app, use raw SQL delete or fetch & delete
        tasks_result = await db.execute(
            select(DailyTask).where(
                DailyTask.user_id == user.id,
                DailyTask.task_date >= start_date,
                DailyTask.task_date <= end_date,
                DailyTask.is_completed == False
            )
        )
        for t in tasks_result.scalars().all():
            await db.delete(t)
        await db.commit()

    # Fetch all subjects and chapters for the user
    subjects_result = await db.execute(
        select(Subject)
        .options(selectinload(Subject.chapters))
        .where(Subject.user_id == user.id)
    )
    subjects = subjects_result.scalars().all()
    
    if not subjects:
        return []

    # Calculate Priority Scores for Chapters
    pending_chapters = []
    
    today = date.today()
    for subject in subjects:
        # 1. Exam Proximity Factor
        days_to_exam = 30 # default
        if subject.exam_date:
            days_to_exam = max((subject.exam_date.date() - today).days, 1)
        
        exam_multiplier = max(1.0, 30.0 / days_to_exam)
        
        for chapter in subject.chapters:
            if chapter.status == ChapterStatus.COMPLETED:
                continue
                
            # 2. Difficulty Factor
            diff_score = 2
            if chapter.difficulty.value == "Hard": diff_score = 3
            if chapter.difficulty.value == "Easy": diff_score = 1
            
            # Base priority = Estimated remaining hours * difficulty * exam proximity
            remaining_hours = max(chapter.estimated_hours - chapter.completed_hours, 0.5)
            
            # Final Score calculation
            priority = int(remaining_hours * diff_score * exam_multiplier * 10)
            
            pending_chapters.append({
                "subject": subject,
                "chapter": chapter,
                "priority": priority,
                "remaining_minutes": int(remaining_hours * 60)
            })

    # Sort by priority descending
    pending_chapters.sort(key=lambda x: x["priority"], reverse=True)
    
    daily_capacity_minutes = user.daily_study_hours * 60
    session_length = user.pomodoro_length_minutes
    
    created_tasks = []
    
    # Simple Greedy Allocation Algorithm
    for day_offset in range(days_to_generate):
        current_date = start_date + timedelta(days=day_offset)
        minutes_allocated_today = 0
        
        # Iterate over pending chapters
        for item in pending_chapters:
            if minutes_allocated_today >= daily_capacity_minutes:
                break
            
            if item["remaining_minutes"] <= 0:
                continue
                
            # How much time to allocate? Min of session_length, remaining_minutes, or remaining capacity today
            time_to_allocate = min(
                session_length, 
                item["remaining_minutes"], 
                daily_capacity_minutes - minutes_allocated_today
            )
            
            if time_to_allocate <= 0:
                continue
                
            # Create a task
            task = DailyTask(
                user_id=user.id,
                subject_id=item["subject"].id,
                chapter_id=item["chapter"].id,
                task_date=current_date,
                duration_minutes=time_to_allocate,
                title=f"Study: {item['chapter'].title}",
                priority_score=item["priority"]
            )
            
            db.add(task)
            created_tasks.append(task)
            
            # Update local state
            item["remaining_minutes"] -= time_to_allocate
            minutes_allocated_today += time_to_allocate
            
    await db.commit()
    
    # We don't fetch back just yet, the router will fetch all tasks for the week to return them.
    return created_tasks
