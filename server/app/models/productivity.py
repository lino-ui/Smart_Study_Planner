from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Habit(Base):
    __tablename__ = "habits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(Date, default=date.today)
    
    # We can track streaks here simply
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    
    logs = relationship("HabitLog", back_populates="habit", cascade="all, delete-orphan")
    user = relationship("User")

class HabitLog(Base):
    __tablename__ = "habit_logs"

    id = Column(Integer, primary_key=True, index=True)
    habit_id = Column(Integer, ForeignKey("habits.id", ondelete="CASCADE"), nullable=False)
    log_date = Column(Date, default=date.today, nullable=False)
    completed = Column(Boolean, default=True)

    habit = relationship("Habit", back_populates="logs")
