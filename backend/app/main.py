from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, diary, sleep

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

@app.get("/")
async def root():
    return {"message": "Diary API"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
