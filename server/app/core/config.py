import os
from typing import List, Union
from pydantic import AnyHttpUrl, validator
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Resolve the absolute path to server/.env and load it explicitly
server_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(dotenv_path=os.path.join(server_root, ".env"))

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Study Planner"
    API_V1_STR: str = "/api/v1"
    
    # BACKEND_CORS_ORIGINS can be a JSON-formatted list or a comma-separated string
    BACKEND_CORS_ORIGINS: Union[List[str], str] = ["http://localhost:5173"]

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-for-development-only")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./test.db")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "dummy-key")

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"

settings = Settings()
