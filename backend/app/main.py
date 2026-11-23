from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import init_sync_db
from app.routes import scan, agent, research, auth

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    init_sync_db()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Powered Security Auditor for AI-Generated Code (IBM Research Track R1)",
    lifespan=lifespan
)

# CORS setup for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def ensure_api_prefix_middleware(request, call_next):
    """
    Ensures API routes match whether Vercel preserves or strips the /api prefix
    when routing requests to the backend service.
    """
    path = request.scope.get("path", "")
    if not path.startswith("/api") and not path.startswith("/health") and not path.startswith("/docs") and not path.startswith("/openapi.json"):
        for prefix in ("/agent", "/scan", "/scans", "/research", "/auth"):
            if path.startswith(prefix):
                request.scope["path"] = f"/api{path}"
                break
    return await call_next(request)

# Register API routers
app.include_router(scan.router)
app.include_router(agent.router)
app.include_router(research.router)
app.include_router(auth.router)

@app.get("/health")
@app.get("/api/health")
def health_check():
    """Health check endpoint required by roadmap checkpoint."""
    return {
        "status": "ok",
        "app": "ARGUS AI",
        "version": settings.VERSION,
        "message": "ARGUS AI backend is running."
    }

# Mount static frontend build if present
frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")
