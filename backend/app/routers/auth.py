from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app import schemas, crud, auth
from app.dependencies import get_current_user
import re
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["authentication"])

def validate_password(password: str) -> bool:
    if len(password) < 8:
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"[a-z]", password):
        return False
    if not re.search(r"\d", password):
        return False
    return True

@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: schemas.UserCreate, db: AsyncSession = Depends(get_db)):
    logger.info(f"Register attempt for email: {user_data.email}")
    
    existing_email = await crud.get_user_by_email(db, user_data.email)
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    existing_username = await crud.get_user_by_username(db, user_data.username)
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    if not validate_password(user_data.password):
        raise HTTPException(status_code=400, detail="Password must be 8+ chars with uppercase, lowercase and numbers")
    
    try:
        user = await crud.create_user(db, user_data)
        logger.info(f"User created successfully: {user_data.email}")
        return user
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

@router.post("/login", response_model=schemas.Token)
async def login(login_data: schemas.LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await crud.get_user_by_email(db, login_data.email)
    if not user or not auth.verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")
    await crud.update_last_login(db, user.id)
    access_token = auth.create_access_token(data={"sub": str(user.id)})
    refresh_token = auth.create_refresh_token(data={"sub": str(user.id)})
    from datetime import datetime, timedelta
    expires_at = datetime.utcnow() + timedelta(days=7)
    await crud.create_refresh_token(db, user.id, refresh_token, expires_at)
    return schemas.Token(access_token=access_token, refresh_token=refresh_token)

@router.get("/me", response_model=schemas.UserResponse)
async def get_current_user_info(current_user=Depends(get_current_user)):
    return current_user

@router.get("/test")
async def test():
    return {"status": "ok"}
