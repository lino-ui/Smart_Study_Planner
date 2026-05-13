from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.schemas.gamification import GamificationStatsResponse, ActivityLogRequest
from app.services.gamification_service import get_or_create_stats, process_activity, calculate_xp_for_level

router = APIRouter()

@router.get("/stats", response_model=GamificationStatsResponse)
async def get_user_stats(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    stats = await get_or_create_stats(db, current_user.id)
    
    # Calculate progress to next level
    current_level_xp = calculate_xp_for_level(stats.current_level)
    next_level_xp = calculate_xp_for_level(stats.current_level + 1)
    
    xp_in_current_level = stats.total_xp - current_level_xp
    xp_needed_for_level = next_level_xp - current_level_xp
    
    progress_percentage = int((xp_in_current_level / xp_needed_for_level) * 100) if xp_needed_for_level > 0 else 100
    
    response_data = stats.__dict__.copy()
    response_data["xp_to_next_level"] = next_level_xp - stats.total_xp
    response_data["progress_percentage"] = progress_percentage
    
    return response_data

@router.post("/log-activity", response_model=GamificationStatsResponse)
async def log_activity(
    request: ActivityLogRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Manually log activity for testing or external triggers.
    Normally this is called internally by other services (like Progress).
    """
    stats = await process_activity(
        db=db, 
        user_id=current_user.id, 
        activity_type=request.activity_type, 
        duration_minutes=request.duration_minutes
    )
    
    # Recalculate progress for response
    current_level_xp = calculate_xp_for_level(stats.current_level)
    next_level_xp = calculate_xp_for_level(stats.current_level + 1)
    xp_in_current_level = stats.total_xp - current_level_xp
    xp_needed_for_level = next_level_xp - current_level_xp
    progress_percentage = int((xp_in_current_level / xp_needed_for_level) * 100) if xp_needed_for_level > 0 else 100
    
    response_data = stats.__dict__.copy()
    response_data["xp_to_next_level"] = next_level_xp - stats.total_xp
    response_data["progress_percentage"] = progress_percentage
    
    return response_data
