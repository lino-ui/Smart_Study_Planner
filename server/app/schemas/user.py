from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

# Shared properties
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    branch: Optional[str] = None
    semester: Optional[int] = Field(None, ge=1, le=10)
    daily_study_hours: Optional[int] = Field(6, ge=1, le=24)
    bio: Optional[str] = None
    preferred_study_time: Optional[str] = "Flexible"
    break_duration_minutes: Optional[int] = 5
    pomodoro_length_minutes: Optional[int] = 25
    long_break_after: Optional[int] = 4

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    branch: Optional[str] = None
    semester: Optional[int] = Field(None, ge=1, le=10)
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class UserPreferencesUpdate(BaseModel):
    daily_study_hours: Optional[int] = Field(None, ge=1, le=24)
    preferred_study_time: Optional[str] = None
    break_duration_minutes: Optional[int] = Field(None, ge=1, le=60)
    pomodoro_length_minutes: Optional[int] = Field(None, ge=1, le=120)
    long_break_after: Optional[int] = Field(None, ge=1, le=10)

class UserResponse(UserBase):
    id: int
    is_active: bool
    avatar_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
