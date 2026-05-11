from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Smart Study Planner API",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
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

# Include routers here when ready
# app.include_router(api_router, prefix=settings.API_V1_STR)
