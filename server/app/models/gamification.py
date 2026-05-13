from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class UserGamificationStats(Base):
    __tablename__ = "user_gamification_stats"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    total_xp = Column(Integer, default=0)
    current_level = Column(Integer, default=1)
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    total_points = Column(Integer, default=0)
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User")
    badges = relationship("BadgeEarned", back_populates="stats", cascade="all, delete-orphan")

class BadgeEarned(Base):
    __tablename__ = "badges_earned"

    id = Column(Integer, primary_key=True, index=True)
    stats_id = Column(Integer, ForeignKey("user_gamification_stats.id", ondelete="CASCADE"), nullable=False)
    badge_name = Column(String, nullable=False)
    badge_icon = Column(String, nullable=False)
    description = Column(String, nullable=True)
    earned_at = Column(DateTime, default=datetime.utcnow)

    stats = relationship("UserGamificationStats", back_populates="badges")
