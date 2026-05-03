from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.routers import auth
from app.database import engine, Base
import logging

logging.basicConfig(
    level=logging.INFO if not settings.debug else logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    logger.info("Shutting down...")
    await engine.dispose()

app = FastAPI(
    title="Diary API",
    description="Backend API for Diary App",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS - use a list, not a string with commas
origins = [
    "https://vibenote.ru",
    "https://www.vibenote.ru",
    "http://localhost:3011",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # This is a list, not a string
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)

app.include_router(auth.router)

@app.get("/")
async def root():
    return {"message": "Diary API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
