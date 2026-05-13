from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import engine, Base
from app.routers import auth, users, subjects, timetable, llm, progress, analytics, gamification, dashboard, rag
from app.models import subject, timetable as timetable_model, chat, progress as progress_model, gamification as gamification_model, document as document_model

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables
    async with engine.begin() as conn:
        # In a real app with Alembic, you would use migrations instead of create_all
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Smart Study Planner API",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
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
