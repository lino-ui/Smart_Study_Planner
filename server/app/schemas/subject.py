from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.subject import DifficultyLevel, ChapterStatus

# ==========================
# Chapter Schemas
# ==========================
class ChapterBase(BaseModel):
    title: str
    description: Optional[str] = None
    difficulty: DifficultyLevel = DifficultyLevel.MEDIUM
    estimated_hours: float = Field(1.0, ge=0.1)
    completed_hours: float = Field(0.0, ge=0.0)
    status: ChapterStatus = ChapterStatus.NOT_STARTED
    order_index: int = 0

class ChapterCreate(ChapterBase):
    pass

class ChapterUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[DifficultyLevel] = None
    estimated_hours: Optional[float] = Field(None, ge=0.1)
    completed_hours: Optional[float] = Field(None, ge=0.0)
    status: Optional[ChapterStatus] = None
    order_index: Optional[int] = None

class ChapterResponse(ChapterBase):
    id: int
    subject_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# ==========================
# Subject Schemas
# ==========================
class SubjectBase(BaseModel):
    name: str
    branch: Optional[str] = None
    semester: Optional[int] = None
    exam_date: Optional[datetime] = None
    total_hours: float = Field(0.0, ge=0.0)
    color: Optional[str] = "#14B8A6"

class SubjectCreate(SubjectBase):
    pass

class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    branch: Optional[str] = None
    semester: Optional[int] = None
    exam_date: Optional[datetime] = None
    total_hours: Optional[float] = Field(None, ge=0.0)
    color: Optional[str] = None

class SubjectResponse(SubjectBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class SubjectWithChapters(SubjectResponse):
    chapters: List[ChapterResponse] = []
