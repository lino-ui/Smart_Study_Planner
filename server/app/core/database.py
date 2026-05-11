from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# Create async engine for SQLAlchemy 2.0
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True
)

# Create session maker
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)

Base = declarative_base()

async def get_db():
    """
    Dependency to get a database session.
    """
    async with AsyncSessionLocal() as session:
        yield session
