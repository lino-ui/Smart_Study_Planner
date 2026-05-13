from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import date, timedelta
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.models.productivity import Habit, HabitLog
from app.schemas.productivity import HabitCreate, HabitResponse

router = APIRouter()

@router.post("/habits", response_model=HabitResponse, status_code=status.HTTP_201_CREATED)
async def create_habit(
    habit_in: HabitCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    habit = Habit(
        user_id=current_user.id,
        name=habit_in.name,
        description=habit_in.description
    )
    db.add(habit)
    await db.commit()
    await db.refresh(habit)
    
    response = habit.__dict__.copy()
    response["is_completed_today"] = False
    return response

@router.get("/habits", response_model=List[HabitResponse])
async def list_habits(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    # Get habits
    result = await db.execute(
        select(Habit).where(Habit.user_id == current_user.id).order_by(Habit.id)
    )
    habits = result.scalars().all()
    
    # Get today's logs to attach 'is_completed_today'
    today = date.today()
    logs_result = await db.execute(
        select(HabitLog).where(
            HabitLog.habit_id.in_([h.id for h in habits]) if habits else False,
            HabitLog.log_date == today
        )
    )
    today_logs = {log.habit_id: log.completed for log in logs_result.scalars().all()}
    
    resp = []
    for h in habits:
        h_dict = h.__dict__.copy()
        h_dict["is_completed_today"] = today_logs.get(h.id, False)
        resp.append(h_dict)
        
    return resp

@router.post("/habits/{habit_id}/toggle", response_model=HabitResponse)
async def toggle_habit_today(
    habit_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    habit = await db.get(Habit, habit_id)
    if not habit or habit.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Habit not found")
        
    today = date.today()
    
    # Check if logged today
    result = await db.execute(
        select(HabitLog).where(HabitLog.habit_id == habit_id, HabitLog.log_date == today)
    )
    log = result.scalars().first()
    
    if log:
        # Untoggle
        await db.delete(log)
        # We should recalculate streak here ideally. For simplicity, just decrement.
        habit.current_streak = max(0, habit.current_streak - 1)
        is_completed = False
    else:
        # Toggle On
        new_log = HabitLog(habit_id=habit_id, log_date=today, completed=True)
        db.add(new_log)
        habit.current_streak += 1
        if habit.current_streak > habit.longest_streak:
            habit.longest_streak = habit.current_streak
        is_completed = True
        
    await db.commit()
    await db.refresh(habit)
    
    response = habit.__dict__.copy()
    response["is_completed_today"] = is_completed
    return response

@router.delete("/habits/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_habit(
    habit_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    habit = await db.get(Habit, habit_id)
    if not habit or habit.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Habit not found")
        
    await db.delete(habit)
    await db.commit()
    return None
