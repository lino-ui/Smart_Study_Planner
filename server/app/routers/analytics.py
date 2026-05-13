from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.schemas.analytics import AnalyticsReport
from app.services.analytics import generate_analytics_report

router = APIRouter()

@router.get("/report", response_model=AnalyticsReport)
async def get_full_analytics_report(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns the comprehensive analytics report for the dashboard.
    """
    report = await generate_analytics_report(db, current_user)
    return report
