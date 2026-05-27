import math
from datetime import date, timedelta, time
from typing import List, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models.user import User
from app.models.subject import Subject, Chapter, ChapterStatus, DifficultyLevel
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
    5. Smart Timing: Allocates chronological blocks with preferred breaks starting at preferred morning/evening hours.
    """
    days_to_generate = max(days_to_generate, 1)
    
    print(f"\n[DEBUG SCHEDULER START]")
    print(f"  User: {getattr(user, 'username', 'Unknown')} (ID: {user.id})")
    print(f"  Start Date: {start_date}, Days to Generate: {days_to_generate}, Regenerate: {regenerate}")
    
    if regenerate:
        end_date = start_date + timedelta(days=days_to_generate - 1)
        tasks_result = await db.execute(
            select(DailyTask).where(
                DailyTask.user_id == user.id,
                DailyTask.task_date >= start_date,
                DailyTask.task_date <= end_date,
                DailyTask.is_completed == False
            )
        )
        deleted_count = 0
        for t in tasks_result.scalars().all():
            await db.delete(t)
            deleted_count += 1
        await db.commit()
        print(f"  Regeneration Active: Cleaned up {deleted_count} existing uncompleted tasks.")

    # Fetch all subjects and chapters for the user
    subjects_result = await db.execute(
        select(Subject)
        .options(selectinload(Subject.chapters))
        .where(Subject.user_id == user.id)
    )
    subjects = subjects_result.scalars().all()
    
    print(f"  Subjects Found: {len(subjects)}")
    if not subjects:
        print("[DEBUG SCHEDULER END] - No subjects found in database.")
        return []

    # Calculate Priority Scores for Chapters
    pending_chapters = []
    today = date.today()
    
    for subject in subjects:
        # 1. Exam Proximity Factor
        days_to_exam = 30 # default fallback
        if subject.exam_date:
            exam_date_obj = subject.exam_date.date() if hasattr(subject.exam_date, 'date') else subject.exam_date
            if isinstance(exam_date_obj, date):
                days_to_exam = max((exam_date_obj - today).days, 1)
        
        exam_multiplier = max(1.0, 30.0 / days_to_exam)
        print(f"    * Subject '{subject.name}' (ID: {subject.id}) | Exam Days Out: {days_to_exam} | Multiplier: {exam_multiplier:.2f}")
        
        for chapter in subject.chapters:
            # We schedule chapters that are not completed (normalize string or enum matching)
            status_val = chapter.status.value if hasattr(chapter.status, 'value') else str(chapter.status)
            if status_val.lower() == "completed" or status_val == ChapterStatus.COMPLETED:
                print(f"        - Chapter '{chapter.title}' (ID: {chapter.id}) is COMPLETED. Skipping.")
                continue
                
            # 2. Difficulty Factor
            diff_score = 2
            diff_val = chapter.difficulty.value if hasattr(chapter.difficulty, 'value') else chapter.difficulty
            if diff_val == "Hard" or diff_val == DifficultyLevel.HARD: 
                diff_score = 3
            elif diff_val == "Easy" or diff_val == DifficultyLevel.EASY: 
                diff_score = 1
            
            # Base priority = Estimated remaining hours * difficulty * exam proximity
            est_hours = chapter.estimated_hours if chapter.estimated_hours is not None else 1.0
            comp_hours = chapter.completed_hours if chapter.completed_hours is not None else 0.0
            remaining_hours = max(est_hours - comp_hours, 0.5)
            
            # Final Score calculation
            priority = int(remaining_hours * diff_score * exam_multiplier * 10)
            remaining_mins = int(remaining_hours * 60)
            
            print(f"        + Chapter '{chapter.title}' (ID: {chapter.id}) | Difficulty: {diff_val} | Remaining: {remaining_hours}h | Priority: {priority}")
            
            pending_chapters.append({
                "subject": subject,
                "chapter": chapter,
                "priority": priority,
                "remaining_minutes": remaining_mins
            })

    # Sort by priority descending
    pending_chapters.sort(key=lambda x: x["priority"], reverse=True)
    print(f"  Total pending study sessions to distribute: {len(pending_chapters)}")
    
    # Safeguard against missing/None/0 settings: enforce a minimum of 1.0 study hour if configured to 0
    daily_hours_val = user.daily_study_hours if user.daily_study_hours is not None else 6.0
    daily_study_hours = max(float(daily_hours_val), 1.0)
    
    pomodoro_val = user.pomodoro_length_minutes if user.pomodoro_length_minutes is not None else 25
    pomodoro_length = max(int(pomodoro_val), 15)
    
    break_val = user.break_duration_minutes if user.break_duration_minutes is not None else 5
    break_duration = max(int(break_val), 0)
    
    daily_capacity_minutes = int(daily_study_hours * 60)
    session_length = pomodoro_length
    
    print(f"  Daily Study Plan - Available Capacity: {daily_capacity_minutes} mins | Session Length: {session_length} mins | Break: {break_duration} mins")
    
    created_tasks = []
    
    # Preferred study time alignment (Morning, Evening, or Flexible default)
    pref_time = getattr(user, 'preferred_study_time', 'Flexible') or 'Flexible'
    start_hour = 10
    if pref_time.lower() == 'morning':
        start_hour = 9
    elif pref_time.lower() == 'evening':
        start_hour = 17
        
    # Greedy chronological allocation
    for day_offset in range(days_to_generate):
        current_date = start_date + timedelta(days=day_offset)
        minutes_allocated_today = 0
        
        current_hour = start_hour
        current_minute = 0
        
        # Iterate over pending chapters
        for item in pending_chapters:
            if minutes_allocated_today >= daily_capacity_minutes:
                break
            
            if item["remaining_minutes"] <= 0:
                continue
                
            # Compute session slot duration
            time_to_allocate = min(
                session_length, 
                item["remaining_minutes"], 
                daily_capacity_minutes - minutes_allocated_today
            )
            
            if time_to_allocate <= 0:
                continue
                
            # Chronological bounds
            task_start = time(current_hour, current_minute)
            
            total_minutes = current_minute + time_to_allocate
            end_hour = current_hour + (total_minutes // 60)
            end_minute = total_minutes % 60
            end_hour = end_hour % 24
            task_end = time(end_hour, end_minute)
            
            # Create a task
            task = DailyTask(
                user_id=user.id,
                subject_id=item["subject"].id,
                chapter_id=item["chapter"].id,
                task_date=current_date,
                start_time=task_start,
                end_time=task_end,
                duration_minutes=time_to_allocate,
                title=f"Study: {item['chapter'].title}",
                priority_score=item["priority"]
            )
            
            db.add(task)
            created_tasks.append(task)
            
            # Update local allocation variables
            item["remaining_minutes"] -= time_to_allocate
            minutes_allocated_today += time_to_allocate
            
            # Add session break interval
            total_next = end_minute + break_duration
            current_hour = end_hour + (total_next // 60)
            current_minute = total_next % 60
            current_hour = current_hour % 24
            
    await db.commit()
    print(f"  Successfully scheduled {len(created_tasks)} study block tasks.")
    print("[DEBUG SCHEDULER END]\n")
    return created_tasks
