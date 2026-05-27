from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import engine, Base
from app.routers import auth, users, subjects, timetable, llm, progress, analytics, gamification, dashboard, rag, productivity
from app.models import subject, timetable as timetable_model, chat, progress as progress_model, gamification as gamification_model, document as document_model, productivity as productivity_model, user as user_model

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables
    async with engine.begin() as conn:
        # In a real app with Alembic, you would use migrations instead of create_all
        await conn.run_sync(Base.metadata.create_all)
    yield

tags_metadata = [
    {"name": "auth", "description": "Operations with users and authentication."},
    {"name": "users", "description": "User profile management."},
    {"name": "subjects", "description": "Manage study subjects and syllabus."},
    {"name": "timetable", "description": "Smart scheduling and calendar features."},
    {"name": "llm", "description": "AI Tutor chat endpoints."},
    {"name": "progress", "description": "Log study sessions and chapters."},
    {"name": "analytics", "description": "Data reporting and visualizations."},
    {"name": "gamification", "description": "XP, Levels, and Badges."},
    {"name": "documents", "description": "Upload and manage RAG documents."},
    {"name": "productivity", "description": "Habit tracker and Pomodoro logs."}
]

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Smart Study Planner API. A fully comprehensive backend for student productivity.",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    openapi_tags=tags_metadata,
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan
)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin).rstrip("/") for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])
app.include_router(subjects.router, prefix=f"{settings.API_V1_STR}/subjects", tags=["subjects"])
app.include_router(timetable.router, prefix=f"{settings.API_V1_STR}/timetable", tags=["timetable"])
app.include_router(llm.router, prefix=f"{settings.API_V1_STR}/llm", tags=["llm"])
app.include_router(progress.router, prefix=f"{settings.API_V1_STR}/progress", tags=["progress"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["analytics"])
app.include_router(gamification.router, prefix=f"{settings.API_V1_STR}/gamification", tags=["gamification"])
app.include_router(dashboard.router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["dashboard"])
app.include_router(rag.router, prefix=f"{settings.API_V1_STR}/documents", tags=["documents"])
app.include_router(productivity.router, prefix=f"{settings.API_V1_STR}/productivity", tags=["productivity"])

@app.get("/")
def root():
    return {
        "project": settings.PROJECT_NAME,
        "message": "Welcome to the Smart Study Planner API",
        "docs": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "version": "1.0.0"}
