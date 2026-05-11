from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.models.subject import Subject, Chapter
from app.schemas.subject import (
    SubjectCreate, SubjectUpdate, SubjectResponse, SubjectWithChapters,
    ChapterCreate, ChapterUpdate, ChapterResponse
)

router = APIRouter()

# ==========================
# Subject Routes
# ==========================
@router.post("/", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
async def create_subject(
    subject_in: SubjectCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    db_subject = Subject(**subject_in.model_dump(), user_id=current_user.id)
    db.add(db_subject)
    await db.commit()
    await db.refresh(db_subject)
    return db_subject

@router.get("/", response_model=List[SubjectResponse])
async def read_subjects(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Subject).where(Subject.user_id == current_user.id))
    return result.scalars().all()

@router.get("/{subject_id}", response_model=SubjectWithChapters)
async def read_subject(
    subject_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Subject)
        .options(selectinload(Subject.chapters))
        .where(Subject.id == subject_id, Subject.user_id == current_user.id)
    )
    subject = result.scalars().first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return subject

@router.put("/{subject_id}", response_model=SubjectResponse)
async def update_subject(
    subject_id: int,
    subject_in: SubjectUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Subject).where(Subject.id == subject_id, Subject.user_id == current_user.id))
    subject = result.scalars().first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    update_data = subject_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(subject, field, value)
        
    await db.commit()
    await db.refresh(subject)
    return subject

@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subject(
    subject_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Subject).where(Subject.id == subject_id, Subject.user_id == current_user.id))
    subject = result.scalars().first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    await db.delete(subject)
    await db.commit()
    return None

# ==========================
# Chapter Routes
# ==========================
@router.post("/{subject_id}/chapters", response_model=ChapterResponse, status_code=status.HTTP_201_CREATED)
async def create_chapter(
    subject_id: int,
    chapter_in: ChapterCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify subject belongs to user
    result = await db.execute(select(Subject).where(Subject.id == subject_id, Subject.user_id == current_user.id))
    subject = result.scalars().first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
        
    db_chapter = Chapter(**chapter_in.model_dump(), subject_id=subject_id)
    db.add(db_chapter)
    await db.commit()
    await db.refresh(db_chapter)
    return db_chapter

@router.put("/chapters/{chapter_id}", response_model=ChapterResponse)
async def update_chapter(
    chapter_id: int,
    chapter_in: ChapterUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    # Join with Subject to ensure the user owns it
    result = await db.execute(
        select(Chapter)
        .join(Subject)
        .where(Chapter.id == chapter_id, Subject.user_id == current_user.id)
    )
    chapter = result.scalars().first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
        
    update_data = chapter_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(chapter, field, value)
        
    await db.commit()
    await db.refresh(chapter)
    return chapter

@router.delete("/chapters/{chapter_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chapter(
    chapter_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Chapter)
        .join(Subject)
        .where(Chapter.id == chapter_id, Subject.user_id == current_user.id)
    )
    chapter = result.scalars().first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
        
    await db.delete(chapter)
    await db.commit()
    return None
