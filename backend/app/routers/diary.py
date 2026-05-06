from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID
from app.database import get_db
from app import schemas, crud
from app.dependencies import get_current_user
from app.models import User
from app.notification_service import NotificationService
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/diary", tags=["diary"])


@router.post(
    "/entries",
    response_model=schemas.DiaryEntryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_entry(
    entry: schemas.DiaryEntryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    logger.info("=" * 50)
    logger.info(f"📝 Creating new diary entry for user {current_user.id}")
    logger.info(f"Entry mood: {entry.mood}")

    # Создаем запись
    db_entry = await crud.create_diary_entry(db, current_user.id, entry)
    logger.info(f"✅ Entry created with id {db_entry.id}")

    # Проверяем и создаем уведомления
    try:
        logger.info("🔔 Checking for notifications...")
        notifications = await NotificationService.check_and_create_notifications(
            db, current_user.id
        )
        logger.info(f"📊 Found {len(notifications)} notifications")

        for notification in notifications:
            db.add(notification)
            logger.info(f"💾 Adding notification: {notification.title}")

        await db.commit()
        logger.info(f"✅ Saved {len(notifications)} notifications to database")

    except Exception as e:
        logger.error(f"❌ Error creating notifications: {e}")
        import traceback

        traceback.print_exc()
        await db.rollback()

    logger.info("=" * 50)
    return db_entry


@router.get("/entries", response_model=List[schemas.DiaryEntryResponse])
async def get_entries(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await crud.get_user_diary_entries(db, current_user.id, skip, limit)


@router.get("/entries/{entry_id}", response_model=schemas.DiaryEntryResponse)
async def get_entry(
    entry_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    entry = await crud.get_diary_entry(db, entry_id, current_user.id)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    return entry


@router.put("/entries/{entry_id}", response_model=schemas.DiaryEntryResponse)
async def update_entry(
    entry_id: UUID,
    entry_update: schemas.DiaryEntryUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    entry = await crud.update_diary_entry(db, entry_id, current_user.id, entry_update)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    return entry


@router.delete("/entries/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_entry(
    entry_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    deleted = await crud.delete_diary_entry(db, entry_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Entry not found")
