from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.models.timetable import DailyTask
from app.models.subject import Subject
from app.schemas.timetable import (
    DailyTaskResponse, DailyTaskUpdate, GenerateTimetableRequest
)
from app.services.scheduler import generate_timetable

router = APIRouter()

@router.post("/generate", response_model=dict, status_code=status.HTTP_201_CREATED)
async def api_generate_timetable(
    request: GenerateTimetableRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Triggers the Smart Scheduler Algorithm to generate a timetable.
    """
    tasks = await generate_timetable(
        db=db,
        user=current_user,
        start_date=request.start_date,
        days_to_generate=request.days_to_generate,
        regenerate=request.regenerate
    )
    
    return {
        "message": f"Successfully generated {len(tasks)} study tasks.",
        "tasks_generated": len(tasks)
    }

@router.get("/weekly", response_model=List[DailyTaskResponse])
async def get_weekly_timetable(
    start_date: date,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all tasks for a specific 7-day window.
    """
    end_date = start_date + timedelta(days=6)
    
    result = await db.execute(
        select(DailyTask)
        .options(selectinload(DailyTask.subject))
        .where(
            DailyTask.user_id == current_user.id,
            DailyTask.task_date >= start_date,
            DailyTask.task_date <= end_date
        )
        .order_by(DailyTask.task_date, DailyTask.id)
    )
    
    tasks = result.scalars().all()
    
    # Map subject info for frontend ease
    response_tasks = []
    for t in tasks:
        task_dict = t.__dict__.copy()
        if t.subject:
            task_dict["subject_color"] = t.subject.color
            task_dict["subject_name"] = t.subject.name
        response_tasks.append(task_dict)
        
    return response_tasks

@router.put("/tasks/{task_id}", response_model=DailyTaskResponse)
async def update_task(
    task_id: int,
    task_in: DailyTaskUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a single task (e.g. mark complete, change duration).
    """
    result = await db.execute(
        select(DailyTask)
        .options(selectinload(DailyTask.subject))
        .where(DailyTask.id == task_id, DailyTask.user_id == current_user.id)
    )
    task = result.scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    update_data = task_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)
        
    await db.commit()
    await db.refresh(task)
    
    task_dict = task.__dict__.copy()
    if task.subject:
        task_dict["subject_color"] = task.subject.color
        task_dict["subject_name"] = task.subject.name
        
    return task_dict
