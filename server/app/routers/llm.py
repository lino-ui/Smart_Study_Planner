from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
import json

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.models.chat import ChatMessage
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
    Send a message to the LLM and get a response.
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
    
    # Format history for LLM client (exclude the message we just saved, we'll pass it as new_message)
    # Actually, the client expects full history. We can just pass history[:-1] as context
    formatted_history = [{"role": h.role, "content": h.content} for h in history[:-1]]

    # 3. Build smart context
    # In a full implementation, you'd fetch user subjects and progress here
    context_data = {
        "daily_study_hours": current_user.daily_study_hours,
        "branch": current_user.branch,
        "semester": current_user.semester,
        "preferred_study_time": getattr(current_user, 'preferred_study_time', 'Flexible'),
        "user_provided_subject_context": request.subject_context
    }
    
    system_prompt = get_system_prompt(
        user_name=current_user.full_name,
        context=json.dumps(context_data, indent=2)
    )

    # 4. Generate Response
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
