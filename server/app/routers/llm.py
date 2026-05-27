from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List
from datetime import date
import json

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.models.chat import ChatMessage
from app.models.subject import Subject, Chapter
from app.models.timetable import DailyTask
from app.models.progress import StudyLog
from app.schemas.chat import ChatRequest, ChatMessageResponse
from app.llm.client import llm_client
from app.llm.prompts import get_system_prompt

router = APIRouter()

@router.get("/history", response_model=List[ChatMessageResponse])
async def get_chat_history(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get the chat history for the current user.
    """
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.created_at)
    )
    return result.scalars().all()

@router.delete("/history", status_code=status.HTTP_204_NO_CONTENT)
async def clear_chat_history(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Clear the chat history.
    """
    result = await db.execute(
        select(ChatMessage).where(ChatMessage.user_id == current_user.id)
    )
    for msg in result.scalars().all():
        await db.delete(msg)
    await db.commit()
    return None

@router.post("/chat", response_model=ChatMessageResponse)
async def chat_with_assistant(
    request: ChatRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Send a message to the LLM and get a response with full grounded user context.
    """
    # 1. Save user message to DB
    user_msg = ChatMessage(
        user_id=current_user.id,
        role="user",
        content=request.message
    )
    db.add(user_msg)
    await db.commit()

    # 2. Fetch history
    history_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.created_at)
    )
    history = history_result.scalars().all()
    
    # Format history for LLM client (exclude the message we just saved)
    formatted_history = [{"role": h.role, "content": h.content} for h in history[:-1]]

    # 3. Fetch Full User Context Eagerly to Ground the AI Assistant
    try:
        # 3a. Subjects and Chapter details
        subjects_result = await db.execute(
            select(Subject)
            .options(selectinload(Subject.chapters))
            .where(Subject.user_id == current_user.id)
        )
        subjects = subjects_result.scalars().all()
        
        subjects_context = []
        for s in subjects:
            chapters_list = [{
                "title": c.title,
                "status": c.status.value if hasattr(c.status, 'value') else str(c.status),
                "difficulty": c.difficulty.value if hasattr(c.difficulty, 'value') else str(c.difficulty),
                "completed_hours": c.completed_hours,
                "estimated_hours": c.estimated_hours
            } for c in s.chapters]
            
            subjects_context.append({
                "subject_name": s.name,
                "exam_date": s.exam_date.isoformat().split('T')[0] if s.exam_date else "None",
                "chapters": chapters_list
            })

        # 3b. Today's Scheduler Daily Tasks
        today = date.today()
        tasks_result = await db.execute(
            select(DailyTask)
            .options(selectinload(DailyTask.subject))
            .where(DailyTask.user_id == current_user.id, DailyTask.task_date == today)
        )
        today_tasks = tasks_result.scalars().all()
        today_tasks_list = [{
            "task_title": t.title,
            "subject": t.subject.name if t.subject else "Unknown",
            "duration_minutes": t.duration_minutes,
            "is_completed": t.is_completed
        } for t in today_tasks]

        # 3c. Recent Study Progress Logs (last 5 logs)
        logs_result = await db.execute(
            select(StudyLog)
            .options(selectinload(StudyLog.subject))
            .where(StudyLog.user_id == current_user.id)
            .order_by(StudyLog.log_date.desc(), StudyLog.created_at.desc())
            .limit(5)
        )
        recent_logs = logs_result.scalars().all()
        recent_logs_list = [{
            "date": l.log_date.isoformat(),
            "subject": l.subject.name if l.subject else "Unknown",
            "duration_minutes": l.duration_minutes,
            "topics_covered": l.topics_covered or "Not specified",
            "mood": l.mood,
            "energy_level": l.energy_level
        } for l in recent_logs]

        # 3d. Assemble complete context object
        context_data = {
            "student_profile": {
                "branch": current_user.branch or "General",
                "semester": current_user.semester,
                "daily_study_hours_goal": current_user.daily_study_hours,
                "preferred_study_time": getattr(current_user, 'preferred_study_time', 'Flexible'),
                "pomodoro_length_minutes": getattr(current_user, 'pomodoro_length_minutes', 25)
            },
            "subjects_and_chapters": subjects_context,
            "timetable_tasks_scheduled_for_today": today_tasks_list,
            "recent_study_logs_history": recent_logs_list,
            "custom_ui_subject_context": request.subject_context
        }
        
    except Exception as context_err:
        # Fallback if database structures are empty or fail to query
        print(f"Context Construction Error: {context_err}")
        context_data = {
            "student_profile": {
                "branch": current_user.branch or "General",
                "semester": current_user.semester,
                "daily_study_hours_goal": current_user.daily_study_hours
            },
            "error": "Full database context could not be loaded"
        }

    system_prompt = get_system_prompt(
        user_name=current_user.full_name,
        context=json.dumps(context_data, indent=2)
    )

    # 4. Generate Response from LLM client
    assistant_response_text = await llm_client.generate_response(
        system_prompt=system_prompt,
        history=formatted_history,
        new_message=request.message
    )

    # 5. Save assistant response to DB
    assistant_msg = ChatMessage(
        user_id=current_user.id,
        role="assistant",
        content=assistant_response_text
    )
    db.add(assistant_msg)
    await db.commit()
    await db.refresh(assistant_msg)

    return assistant_msg
