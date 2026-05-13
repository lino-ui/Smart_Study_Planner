import math
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models.user import User
from app.models.gamification import UserGamificationStats, BadgeEarned

def calculate_xp_for_level(level: int) -> int:
    """
    Returns total XP required to reach the given level.
    Formula: level^2 * 100
    Lvl 1 = 0 XP
    Lvl 2 = 400 XP
    Lvl 3 = 900 XP
    Lvl 4 = 1600 XP
    """
    if level <= 1:
        return 0
    return int(math.pow(level, 2) * 100)

async def get_or_create_stats(db: AsyncSession, user_id: int) -> UserGamificationStats:
    result = await db.execute(
        select(UserGamificationStats)
        .options(selectinload(UserGamificationStats.badges))
        .where(UserGamificationStats.user_id == user_id)
    )
    stats = result.scalars().first()
    
    if not stats:
        stats = UserGamificationStats(user_id=user_id)
        db.add(stats)
        await db.commit()
        await db.refresh(stats)
    
    return stats

async def check_and_award_badges(db: AsyncSession, stats: UserGamificationStats, activity_type: str, context: dict):
    """
    Checks conditions and awards badges if not already earned.
    """
    earned_badge_names = {b.badge_name for b in stats.badges}
    new_badges = []

    def award(name, icon, desc):
        if name not in earned_badge_names:
            badge = BadgeEarned(stats_id=stats.id, badge_name=name, badge_icon=icon, description=desc)
            db.add(badge)
            new_badges.append(badge)
            earned_badge_names.add(name)

    if activity_type == "study_session":
        award("First Steps", "Award", "Completed your first study session.")
        
        # Check streak badges
        streak = stats.current_streak
        if streak >= 3:
            award("On Fire", "Flame", "Maintained a 3-day study streak.")
        if streak >= 7:
            award("Consistency King", "Crown", "Maintained a 7-day study streak.")
            
        # Time-based badges
        hour = datetime.utcnow().hour
        if hour >= 4 and hour <= 8:
            award("Early Bird", "Sunrise", "Studied early in the morning.")
        elif hour >= 22 or hour <= 3:
            award("Night Owl", "Moon", "Studied late at night.")

    if activity_type == "chapter_completed":
        award("Knowledge Seeker", "BookOpen", "Completed a syllabus chapter.")

    if new_badges:
        await db.commit()
        
    return new_badges

async def process_activity(db: AsyncSession, user_id: int, activity_type: str, duration_minutes: int = 0):
    stats = await get_or_create_stats(db, user_id)
    
    xp_gained = 0
    points_gained = 0
    
    if activity_type == "study_session":
        # Base XP: 10 XP per minute
        xp_gained = duration_minutes * 10
        # Multiplier based on streak
        multiplier = 1.0 + (min(stats.current_streak, 10) * 0.1)
        xp_gained = int(xp_gained * multiplier)
        points_gained = int(duration_minutes / 10)  # 1 point per 10 mins
        
    elif activity_type == "chapter_completed":
        xp_gained = 500
        points_gained = 50

    # Apply gains
    stats.total_xp += xp_gained
    stats.total_points += points_gained
    
    # Check level up
    while stats.total_xp >= calculate_xp_for_level(stats.current_level + 1):
        stats.current_level += 1
        
    db.add(stats)
    await db.commit()
    await db.refresh(stats)

    # Check Badges
    await check_and_award_badges(db, stats, activity_type, {"duration": duration_minutes})
    
    return stats
