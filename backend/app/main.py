from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.routers import auth
from app.database import engine, Base
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.debug else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown
    logger.info("Shutting down...")
    await engine.dispose()


app = FastAPI(
    title="Diary API",
    description="Backend API for Diary App",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS - Allow all for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3011",
        "http://localhost:3000",
        "http://127.0.0.1:3011",
        "http://127.0.0.1:3000",
        "http://localhost:8011",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Optional: Add trusted host middleware for production only
if settings.environment == "production":
    app.add_middleware(
        TrustedHostMiddleware, allowed_hosts=["calmnote.ru", "api.calmnote.ru"]
    )

# Include routers
app.include_router(auth.router)


@app.get("/")
async def root():
    return {"message": "Diary API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
