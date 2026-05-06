from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID
from app.database import get_db
from app.dependencies import get_current_user
from app.models import User, Notification
from app.notification_service import NotificationService
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/")
async def get_notifications(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    logger.info(f"Getting notifications for user {current_user.id}")
    notifications = await NotificationService.get_unread_notifications(
        db, current_user.id
    )

    result = []
    for n in notifications:
        result.append(
            {
                "id": str(n.id),
                "title": n.title,
                "message": n.message,
                "type": n.type,
                "created_at": n.created_at.isoformat(),
                "is_read": n.is_read,
            }
        )
    return result


@router.post("/{notification_id}/read")
async def mark_notification_read(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    success = await NotificationService.mark_as_read(
        db, notification_id, current_user.id
    )
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Marked as read"}


@router.post("/test")
async def test_notifications(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """Тестовый эндпоинт для создания уведомления"""
    logger.info(f"Creating test notification for user {current_user.id}")

    test_notification = Notification(
        user_id=current_user.id,
        title="🧪 Тестовое уведомление",
        message="Это тестовое уведомление для проверки работы системы!",
        type="info",
    )
    db.add(test_notification)
    await db.commit()

    return {"message": "Test notification created"}
