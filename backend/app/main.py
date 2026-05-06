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
    notifications,
)
from app.middleware import RateLimitMiddleware, SecurityHeadersMiddleware

app = FastAPI(title="Diary API", version="1.0.0")

# CORS настройки для cookie-based аутентификации
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3011",
        "http://127.0.0.1:3011",
        "https://vibenote.ru",
        "https://www.vibenote.ru",
    ],
    allow_credentials=True,  # Важно для кук
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Добавляем middleware безопасности
app.add_middleware(RateLimitMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

# Подключаем роутеры
app.include_router(auth.router)
app.include_router(diary.router)
app.include_router(sleep.router)
app.include_router(sleep_notes.router)
app.include_router(personality.router)
app.include_router(planner.router)
app.include_router(notes.router)
app.include_router(study_timer.router)
app.include_router(notifications.router)


@app.get("/")
async def root():
    return {"message": "Diary API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
