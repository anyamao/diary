from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app import schemas, crud, auth
from app.dependencies import get_current_user
from app.config import settings
import re
import logging
from datetime import datetime, timedelta

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


def set_tokens_cookies(response: Response, access_token: str, refresh_token: str):
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=settings.cookie_httponly,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        max_age=settings.cookie_max_age,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=settings.cookie_httponly,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        max_age=settings.refresh_cookie_max_age,
        path="/",
    )


def clear_tokens_cookies(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")


@router.post(
    "/register",
    response_model=schemas.UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(user_data: schemas.UserCreate, db: AsyncSession = Depends(get_db)):
    logger.info(f"Register attempt for email: {user_data.email}")

    existing_email = await crud.get_user_by_email(db, user_data.email)
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    existing_username = await crud.get_user_by_username(db, user_data.username)
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")

    if not validate_password(user_data.password):
        raise HTTPException(
            status_code=400,
            detail="Password must be 8+ chars with uppercase, lowercase and numbers",
        )

    try:
        user = await crud.create_user(db, user_data)
        logger.info(f"User created successfully: {user_data.email}")
        return user
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.post("/login", response_model=schemas.Token)
async def login(
    request: Request,
    login_data: schemas.LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    user = await crud.get_user_by_email(db, login_data.email)
    if not user or not auth.verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    await crud.update_last_login(db, user.id)

    access_token = auth.create_access_token(data={"sub": str(user.id)})
    refresh_token = auth.create_refresh_token(data={"sub": str(user.id)})

    expires_at = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
    await crud.create_refresh_token(db, user.id, refresh_token, expires_at)

    set_tokens_cookies(response, access_token, refresh_token)

    return schemas.Token(access_token=access_token, refresh_token=refresh_token)


@router.post("/logout")
async def logout(
    response: Response,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await crud.revoke_all_user_tokens(db, current_user.id)
    clear_tokens_cookies(response)
    return {"message": "Successfully logged out"}


@router.post("/refresh")
async def refresh_token(
    request: Request, response: Response, db: AsyncSession = Depends(get_db)
):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token not found")

    payload = auth.decode_token(refresh_token)
    if not payload or payload.type != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    stored_token = await crud.get_refresh_token(db, refresh_token)
    if not stored_token or stored_token.revoked:
        raise HTTPException(status_code=401, detail="Refresh token revoked")

    from datetime import datetime, timezone

    if stored_token.expires_at.replace(tzinfo=timezone.utc) < datetime.now(
        timezone.utc
    ):
        raise HTTPException(status_code=401, detail="Refresh token expired")

    user = await crud.get_user_by_id(db, payload.sub)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    new_access_token = auth.create_access_token(data={"sub": str(user.id)})
    new_refresh_token = auth.create_refresh_token(data={"sub": str(user.id)})

    await crud.revoke_refresh_token(db, refresh_token)
    expires_at = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
    await crud.create_refresh_token(db, user.id, new_refresh_token, expires_at)

    set_tokens_cookies(response, new_access_token, new_refresh_token)

    return {"message": "Tokens refreshed"}


@router.get("/me", response_model=schemas.UserResponse)
async def get_current_user_info(current_user=Depends(get_current_user)):
    return current_user


@router.get("/test")
async def test():
    return {"status": "ok"}
