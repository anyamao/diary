from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models import DiaryEntry, Notification
from datetime import datetime, timedelta
from uuid import UUID
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class NotificationService:
    @staticmethod
    async def check_and_create_notifications(db: AsyncSession, user_id: UUID):
        print("=" * 50)
        print(f"🔔 NOTIFICATION SERVICE CALLED for user {user_id}")
        print("=" * 50)

        notifications = []

        # 1. Проверка на 3 грустных записи подряд
        print("Checking sad streak...")
        sad_notification = await NotificationService._check_sad_streak(db, user_id)
        if sad_notification:
            print(f"✅ Sad streak notification created")
            notifications.append(sad_notification)
        else:
            print("❌ No sad streak")

        # 2. Проверка на 10 дней подряд записей
        print("Checking writing streak...")
        streak_notification = await NotificationService._check_writing_streak(
            db, user_id
        )
        if streak_notification:
            print(f"✅ Writing streak notification created")
            notifications.append(streak_notification)
        else:
            print("❌ No writing streak")

        # 3. Проверка на 5 записей за неделю
        print("Checking weekly activity...")
        weekly_notification = await NotificationService._check_weekly_activity(
            db, user_id
        )
        if weekly_notification:
            print(f"✅ Weekly activity notification created")
            notifications.append(weekly_notification)
        else:
            print("❌ No weekly activity")

        print(f"📊 Total notifications: {len(notifications)}")
        return notifications

    @staticmethod
    async def _check_sad_streak(db: AsyncSession, user_id: UUID):
        print(f"  - Getting last 3 entries for user {user_id}")
        result = await db.execute(
            select(DiaryEntry)
            .where(DiaryEntry.user_id == user_id)
            .order_by(DiaryEntry.created_at.desc())
            .limit(3)
        )
        last_entries = result.scalars().all()
        print(f"  - Found {len(last_entries)} entries")

        if len(last_entries) == 3:
            sad_moods = ["sad", "verysad"]
            sad_count = sum(1 for entry in last_entries if entry.mood in sad_moods)
            print(f"  - Sad entries count: {sad_count}")

            if sad_count == 3:
                print(f"  ✅ Creating sad notification!")
                return Notification(
                    user_id=user_id,
                    title="💔 Поддержка",
                    message="У всех бывают черные полосы, но ты обязательно справишься! Помни, что ты сильный человек. Хочешь поговорить о том, что тебя беспокоит?",
                    type="warning",
                )
        return None

    @staticmethod
    async def _check_writing_streak(db: AsyncSession, user_id: UUID):
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        result = await db.execute(
            select(DiaryEntry)
            .where(
                DiaryEntry.user_id == user_id, DiaryEntry.created_at >= thirty_days_ago
            )
            .order_by(DiaryEntry.created_at)
        )
        entries = result.scalars().all()
        print(f"  - Found {len(entries)} entries in last 30 days")

        if len(entries) >= 10:
            dates = sorted(set([e.created_at.date() for e in entries]))
            streak = 1
            for i in range(1, len(dates)):
                if (dates[i] - dates[i - 1]).days == 1:
                    streak += 1
                    if streak >= 10:
                        print(f"  ✅ Creating streak notification! Streak: {streak}")
                        return Notification(
                            user_id=user_id,
                            title="🎉 Потрясающая дисциплина!",
                            message=f"Ты пишешь уже {streak} дней подряд! Это невероятный прогресс! Продолжай в том же духе! 💪",
                            type="celebrate",
                        )
                else:
                    streak = 1
        return None

    @staticmethod
    async def _check_weekly_activity(db: AsyncSession, user_id: UUID):
        week_ago = datetime.utcnow() - timedelta(days=7)
        result = await db.execute(
            select(func.count(DiaryEntry.id)).where(
                DiaryEntry.user_id == user_id, DiaryEntry.created_at >= week_ago
            )
        )
        count = result.scalar() or 0
        print(f"  - Found {count} entries in last week")

        if count >= 5:
            print(f"  ✅ Creating weekly activity notification!")
            return Notification(
                user_id=user_id,
                title="📝 Активная неделя!",
                message=f"Ты написал {count} записей за эту неделю! Отличная работа по саморефлексии! 🌟",
                type="success",
            )
        return None

    @staticmethod
    async def get_unread_notifications(db: AsyncSession, user_id: UUID):
        result = await db.execute(
            select(Notification)
            .where(Notification.user_id == user_id, Notification.is_read == False)
            .order_by(Notification.created_at.desc())
        )
        return result.scalars().all()

    @staticmethod
    async def mark_as_read(db: AsyncSession, notification_id: UUID, user_id: UUID):
        result = await db.execute(
            select(Notification).where(
                Notification.id == notification_id, Notification.user_id == user_id
            )
        )
        notification = result.scalar_one_or_none()
        if notification:
            notification.is_read = True
            await db.commit()
            return True
        return False
