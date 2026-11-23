from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.models import Base

# Standard robust SQLite engine
engine = create_engine(
    settings.SYNC_DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
SyncSessionLocal = SessionLocal

def init_db():
    Base.metadata.create_all(bind=engine)

def init_sync_db():
    Base.metadata.create_all(bind=engine)

# Auto-initialize database schema immediately for serverless/cold-start environments
try:
    init_sync_db()
except Exception as _e:
    pass

def get_db():
    try:
        init_sync_db()
    except Exception:
        pass
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
