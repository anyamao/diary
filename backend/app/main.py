from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import (
    auth,
    diary,
    sleep,
    sleep_notes,
    personality,
    planner,
    notes,
    study_timer,
)
import os

app = FastAPI(title="Diary API", version="1.0.0")

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
IS_DEVELOPMENT = ENVIRONMENT == "development"

if IS_DEVELOPMENT:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3011",
            "http://127.0.0.1:3011",
            "http://localhost:3000",
            "http://localhost:8081",
            "http://127.0.0.1:8081",
            "http://127.0.0.1:3000",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )
    print("🔧 CORS enabled for development (localhost)")
else:
    print("🔒 CORS disabled for production (handled by Nginx)")

app.include_router(auth.router)
app.include_router(diary.router)
app.include_router(sleep.router)
app.include_router(sleep_notes.router)
app.include_router(personality.router)
app.include_router(planner.router)
app.include_router(notes.router)
app.include_router(study_timer.router)


@app.get("/")
async def root():
    return {"message": "Diary API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
