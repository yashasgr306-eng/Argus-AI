import os
from pathlib import Path
from typing import Set
from pydantic import BaseModel, ConfigDict, Field

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True, parents=True)

UPLOAD_DIR = DATA_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True, parents=True)

EXTRACT_DIR = DATA_DIR / "extracted"
EXTRACT_DIR.mkdir(exist_ok=True, parents=True)

DB_PATH = DATA_DIR / "argus.db"

class Settings(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    PROJECT_NAME: str = "ARGUS AI"
    VERSION: str = "1.0.0"
    DATABASE_URL: str = f"sqlite:///{DB_PATH}"
    SYNC_DATABASE_URL: str = f"sqlite:///{DB_PATH}"
    
    # Expose paths directly on settings
    DATA_DIR: Path = DATA_DIR
    UPLOAD_DIR: Path = UPLOAD_DIR
    EXTRACT_DIR: Path = EXTRACT_DIR
    DB_PATH: Path = DB_PATH

    # Safety boundaries
    MAX_ARCHIVE_SIZE_BYTES: int = 25 * 1024 * 1024  # 25 MB max
    MAX_FILE_COUNT: int = 1000
    MAX_UNCOMPRESSED_RATIO: int = 50  # Prevent zip bomb
    ALLOWED_EXTENSIONS: Set[str] = Field(default_factory=lambda: {
        ".py", ".js", ".ts", ".jsx", ".tsx", ".json", ".yaml", ".yml",
        ".env", ".env.example", ".txt", ".md", ".html", ".css", ".sql",
        ".sh", ".toml", ".ini", ".cfg", ".xml"
    })

    # IBM watsonx / Granite Configuration
    WATSONX_API_KEY: str = os.getenv("WATSONX_API_KEY", "")
    WATSONX_PROJECT_ID: str = os.getenv("WATSONX_PROJECT_ID", "")
    WATSONX_URL: str = os.getenv("WATSONX_URL", "https://us-south.ml.cloud.ibm.com")
    GRANITE_MODEL_ID: str = os.getenv("GRANITE_MODEL_ID", "ibm/granite-3-8b-instruct")

    # Google OAuth Configuration
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")

settings = Settings()
