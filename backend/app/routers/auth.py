from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import timedelta
from app.database import get_db
from app import schemas, crud, auth
from app.config import settings
from app.dependencies import get_current_user
import re

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


@router.post(
    "/register",
    response_model=schemas.UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(user_data: schemas.UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if user exists
    existing_email = await crud.get_user_by_email(db, user_data.email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )

    existing_username = await crud.get_user_by_username(db, user_data.username)
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken"
        )

    # Validate password strength
    if not validate_password(user_data.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters and contain uppercase, lowercase, and numbers",
        )

    # Create user
    user = await crud.create_user(db, user_data)
    return user


@router.post("/login", response_model=schemas.Token)
async def login(login_data: schemas.LoginRequest, db: AsyncSession = Depends(get_db)):
    # Find user by email
    user = await crud.get_user_by_email(db, login_data.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password"
        )

    # Verify password
    if not auth.verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password"
        )

    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated"
        )

    # Update last login
    await crud.update_last_login(db, user.id)

    # Create tokens
    access_token = auth.create_access_token(data={"sub": str(user.id)})
    refresh_token = auth.create_refresh_token(data={"sub": str(user.id)})

    # Store refresh token
    from datetime import datetime, timedelta

    expires_at = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
    await crud.create_refresh_token(db, user.id, refresh_token, expires_at)

    return schemas.Token(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=schemas.Token)
async def refresh_token(
    refresh_data: schemas.RefreshTokenRequest, db: AsyncSession = Depends(get_db)
):
    # Verify refresh token
    payload = auth.decode_token(refresh_data.refresh_token)
    if not payload or payload.type != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )

    # Check if token exists in DB and is not revoked
    stored_token = await crud.get_refresh_token(db, refresh_data.refresh_token)
    if not stored_token or stored_token.revoked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token revoked or not found",
        )

    # Check if token expired
    from datetime import datetime, timezone

    if stored_token.expires_at.replace(tzinfo=timezone.utc) < datetime.now(
        timezone.utc
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired"
        )

    # Get user
    user = await crud.get_user_by_id(db, payload.sub)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    # Create new tokens
    new_access_token = auth.create_access_token(data={"sub": str(user.id)})
    new_refresh_token = auth.create_refresh_token(data={"sub": str(user.id)})

    # Revoke old refresh token and create new one
    await crud.revoke_refresh_token(db, refresh_data.refresh_token)
    from datetime import datetime, timedelta

    expires_at = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
    await crud.create_refresh_token(db, user.id, new_refresh_token, expires_at)

    return schemas.Token(access_token=new_access_token, refresh_token=new_refresh_token)


@router.post("/logout", response_model=schemas.MessageResponse)
async def logout(
    refresh_data: schemas.RefreshTokenRequest, db: AsyncSession = Depends(get_db)
):
    await crud.revoke_refresh_token(db, refresh_data.refresh_token)
    return schemas.MessageResponse(message="Successfully logged out", success=True)


@router.get("/me", response_model=schemas.UserResponse)
async def get_current_user_info(current_user=Depends(get_current_user)):
    return current_user
