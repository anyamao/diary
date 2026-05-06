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

app = FastAPI(title="Diary API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3011"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    return {"message": "Diary API"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
