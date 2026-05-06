from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models import (
    User,
    RefreshToken,
    DiaryEntry,
    ShoppingItem,
    SleepRecord,
    SleepNote,
    MoodItem,
    PersonalityTestResult,
    DepressionTestResult,
    SelfNote,
    PlannerDay,
    PlannerTask,
    BusinessNote,
)
from app.schemas import (
    UserCreate,
    DiaryEntryCreate,
    DiaryEntryUpdate,
    ShoppingItemCreate,
    SleepRecordCreate,
    SleepRecordUpdate,
    SleepNoteCreate,
    SleepNoteUpdate,
    PlannerTaskCreate,
    PlannerTaskUpdate,
    PlannerDayUpdate,
    BusinessNoteBase,
    BusinessNoteCreate,
    BusinessNoteUpdate,
    BusinessNoteResponse,
)
from app.auth import get_password_hash
from datetime import datetime, timedelta, date
from uuid import UUID
from typing import Optional, List


# User CRUD
async def create_user(db: AsyncSession, user: UserCreate) -> User:
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password,
        full_name=user.full_name,
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_username(db: AsyncSession, username: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.username == username))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: UUID) -> Optional[User]:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def update_last_login(db: AsyncSession, user_id: UUID) -> None:
    await db.execute(
        update(User).where(User.id == user_id).values(last_login=datetime.utcnow())
    )
    await db.commit()


# Refresh Token CRUD
async def create_refresh_token(
    db: AsyncSession, user_id: UUID, token: str, expires_at: datetime
) -> RefreshToken:
    db_token = RefreshToken(user_id=user_id, token=token, expires_at=expires_at)
    db.add(db_token)
    await db.commit()
    await db.refresh(db_token)
    return db_token


async def create_business_note(
    db: AsyncSession, user_id: UUID, note: BusinessNoteCreate
) -> BusinessNote:
    db_note = BusinessNote(
        user_id=user_id,
        title=note.title,
        content=note.content,
        tags=note.tags,
        is_pinned=note.is_pinned,
    )
    db.add(db_note)
    await db.commit()
    await db.refresh(db_note)
    return db_note


async def get_user_business_notes(
    db: AsyncSession,
    user_id: UUID,
    skip: int = 0,
    limit: int = 100,
    tag: Optional[str] = None,
) -> List[BusinessNote]:
    query = select(BusinessNote).where(BusinessNote.user_id == user_id)
    if tag:
        query = query.where(BusinessNote.tags.contains(tag))
    result = await db.execute(
        query.order_by(BusinessNote.is_pinned.desc(), BusinessNote.updated_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


async def get_business_note(
    db: AsyncSession, note_id: UUID, user_id: UUID
) -> Optional[BusinessNote]:
    result = await db.execute(
        select(BusinessNote).where(
            BusinessNote.id == note_id, BusinessNote.user_id == user_id
        )
    )
    return result.scalar_one_or_none()


async def update_business_note(
    db: AsyncSession, note_id: UUID, user_id: UUID, note_update: BusinessNoteUpdate
) -> Optional[BusinessNote]:
    db_note = await get_business_note(db, note_id, user_id)
    if not db_note:
        return None

    update_data = note_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_note, key, value)

    await db.commit()
    await db.refresh(db_note)
    return db_note


async def delete_business_note(db: AsyncSession, note_id: UUID, user_id: UUID) -> bool:
    db_note = await get_business_note(db, note_id, user_id)
    if not db_note:
        return False
    await db.delete(db_note)
    await db.commit()
    return True


async def toggle_pin_business_note(
    db: AsyncSession, note_id: UUID, user_id: UUID
) -> Optional[BusinessNote]:
    db_note = await get_business_note(db, note_id, user_id)
    if db_note:
        db_note.is_pinned = not db_note.is_pinned
        await db.commit()
        await db.refresh(db_note)
    return db_note


async def get_refresh_token(db: AsyncSession, token: str) -> Optional[RefreshToken]:
    result = await db.execute(select(RefreshToken).where(RefreshToken.token == token))
    return result.scalar_one_or_none()


async def revoke_refresh_token(db: AsyncSession, token: str) -> None:
    await db.execute(
        update(RefreshToken).where(RefreshToken.token == token).values(revoked=True)
    )
    await db.commit()


async def revoke_all_user_tokens(db: AsyncSession, user_id: UUID) -> None:
    await db.execute(
        update(RefreshToken).where(RefreshToken.user_id == user_id).values(revoked=True)
    )
    await db.commit()


# Diary Entry CRUD
async def create_diary_entry(
    db: AsyncSession, user_id: UUID, entry: DiaryEntryCreate
) -> DiaryEntry:
    db_entry = DiaryEntry(
        user_id=user_id,
        title=entry.title,
        content=entry.content,
        mood=entry.mood,
        tags=entry.tags,
        is_favorite=entry.is_favorite,
    )
    db.add(db_entry)
    await db.commit()
    await db.refresh(db_entry)
    return db_entry


async def get_user_diary_entries(
    db: AsyncSession, user_id: UUID, skip: int = 0, limit: int = 50
) -> List[DiaryEntry]:
    result = await db.execute(
        select(DiaryEntry)
        .where(DiaryEntry.user_id == user_id)
        .order_by(DiaryEntry.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


async def get_diary_entry(
    db: AsyncSession, entry_id: UUID, user_id: UUID
) -> Optional[DiaryEntry]:
    result = await db.execute(
        select(DiaryEntry).where(
            DiaryEntry.id == entry_id, DiaryEntry.user_id == user_id
        )
    )
    return result.scalar_one_or_none()


async def update_diary_entry(
    db: AsyncSession, entry_id: UUID, user_id: UUID, entry_update: DiaryEntryUpdate
) -> Optional[DiaryEntry]:
    db_entry = await get_diary_entry(db, entry_id, user_id)
    if not db_entry:
        return None

    update_data = entry_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_entry, key, value)

    await db.commit()
    await db.refresh(db_entry)
    return db_entry


async def delete_diary_entry(db: AsyncSession, entry_id: UUID, user_id: UUID) -> bool:
    db_entry = await get_diary_entry(db, entry_id, user_id)
    if not db_entry:
        return False

    await db.delete(db_entry)
    await db.commit()
    return True


# Shopping Item CRUD
async def create_shopping_item(
    db: AsyncSession, user_id: UUID, item: ShoppingItemCreate
) -> ShoppingItem:
    db_item = ShoppingItem(
        user_id=user_id,
        name=item.name,
        quantity=item.quantity,
        unit=item.unit,
        category=item.category,
    )
    db.add(db_item)
    await db.commit()
    await db.refresh(db_item)
    return db_item


async def get_user_shopping_items(
    db: AsyncSession, user_id: UUID, completed: Optional[bool] = None
) -> List[ShoppingItem]:
    query = select(ShoppingItem).where(ShoppingItem.user_id == user_id)
    if completed is not None:
        query = query.where(ShoppingItem.is_completed == completed)
    result = await db.execute(query.order_by(ShoppingItem.created_at.desc()))
    return result.scalars().all()


async def toggle_shopping_item(
    db: AsyncSession, item_id: UUID, user_id: UUID
) -> Optional[ShoppingItem]:
    result = await db.execute(
        select(ShoppingItem).where(
            ShoppingItem.id == item_id, ShoppingItem.user_id == user_id
        )
    )
    db_item = result.scalar_one_or_none()
    if db_item:
        db_item.is_completed = not db_item.is_completed
        await db.commit()
        await db.refresh(db_item)
    return db_item


async def delete_shopping_item(db: AsyncSession, item_id: UUID, user_id: UUID) -> bool:
    result = await db.execute(
        select(ShoppingItem).where(
            ShoppingItem.id == item_id, ShoppingItem.user_id == user_id
        )
    )
    db_item = result.scalar_one_or_none()
    if not db_item:
        return False
    await db.delete(db_item)
    await db.commit()
    return True


# Sleep Record CRUD
async def create_sleep_record(
    db: AsyncSession, user_id: UUID, record: SleepRecordCreate
) -> SleepRecord:
    db_record = SleepRecord(
        user_id=user_id,
        date=record.date,
        sleep_start=record.sleep_start,
        sleep_end=record.sleep_end,
        duration_hours=record.duration_hours,
    )
    db.add(db_record)
    await db.commit()
    await db.refresh(db_record)
    return db_record


async def get_sleep_record_by_date(
    db: AsyncSession, user_id: UUID, record_date: date
) -> Optional[SleepRecord]:
    result = await db.execute(
        select(SleepRecord).where(
            SleepRecord.user_id == user_id, SleepRecord.date == record_date
        )
    )
    return result.scalar_one_or_none()


async def get_user_sleep_records(
    db: AsyncSession,
    user_id: UUID,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> List[SleepRecord]:
    query = select(SleepRecord).where(SleepRecord.user_id == user_id)
    if start_date:
        query = query.where(SleepRecord.date >= start_date)
    if end_date:
        query = query.where(SleepRecord.date <= end_date)
    result = await db.execute(query.order_by(SleepRecord.date.desc()))
    return result.scalars().all()


async def update_sleep_record(
    db: AsyncSession,
    record_id: UUID,
    user_id: UUID,
    record_update: SleepRecordUpdate,
) -> Optional[SleepRecord]:
    result = await db.execute(
        select(SleepRecord).where(
            SleepRecord.id == record_id, SleepRecord.user_id == user_id
        )
    )
    db_record = result.scalar_one_or_none()
    if not db_record:
        return None

    update_data = record_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_record, key, value)

    await db.commit()
    await db.refresh(db_record)
    return db_record


async def delete_sleep_record(db: AsyncSession, record_id: UUID, user_id: UUID) -> bool:
    result = await db.execute(
        select(SleepRecord).where(
            SleepRecord.id == record_id, SleepRecord.user_id == user_id
        )
    )
    db_record = result.scalar_one_or_none()
    if not db_record:
        return False
    await db.delete(db_record)
    await db.commit()
    return True


# Sleep Note CRUD
async def create_sleep_note(
    db: AsyncSession, user_id: UUID, note: SleepNoteCreate
) -> SleepNote:
    db_note = SleepNote(
        sleep_record_id=note.sleep_record_id,
        user_id=user_id,
        title=note.title,
        content=note.content,
        dream_type=note.dream_type,
        wake_mood=note.wake_mood,
        tags=note.tags,
    )
    db.add(db_note)
    await db.commit()
    await db.refresh(db_note)
    return db_note


async def get_sleep_notes_by_record(
    db: AsyncSession, sleep_record_id: UUID, user_id: UUID
) -> List[SleepNote]:
    result = await db.execute(
        select(SleepNote)
        .where(
            SleepNote.sleep_record_id == sleep_record_id, SleepNote.user_id == user_id
        )
        .order_by(SleepNote.created_at.desc())
    )
    return result.scalars().all()


async def get_all_sleep_notes(db: AsyncSession, user_id: UUID) -> List[SleepNote]:
    result = await db.execute(
        select(SleepNote)
        .where(SleepNote.user_id == user_id)
        .order_by(SleepNote.created_at.desc())
    )
    return result.scalars().all()


async def get_sleep_note(
    db: AsyncSession, note_id: UUID, user_id: UUID
) -> Optional[SleepNote]:
    result = await db.execute(
        select(SleepNote).where(SleepNote.id == note_id, SleepNote.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def update_sleep_note(
    db: AsyncSession, note_id: UUID, user_id: UUID, note_update: SleepNoteUpdate
) -> Optional[SleepNote]:
    db_note = await get_sleep_note(db, note_id, user_id)
    if not db_note:
        return None

    update_data = note_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_note, key, value)

    await db.commit()
    await db.refresh(db_note)
    return db_note


async def delete_sleep_note(db: AsyncSession, note_id: UUID, user_id: UUID) -> bool:
    db_note = await get_sleep_note(db, note_id, user_id)
    if not db_note:
        return False
    await db.delete(db_note)
    await db.commit()
    return True


# Planner Day CRUD
async def get_or_create_planner_day(
    db: AsyncSession, user_id: UUID, day_date: date
) -> PlannerDay:
    result = await db.execute(
        select(PlannerDay).where(
            PlannerDay.user_id == user_id, PlannerDay.date == day_date
        )
    )
    planner_day = result.scalar_one_or_none()

    if not planner_day:
        planner_day = PlannerDay(user_id=user_id, date=day_date)
        db.add(planner_day)
        await db.commit()
        await db.refresh(planner_day)

    return planner_day


async def get_planner_day(
    db: AsyncSession, user_id: UUID, day_date: date
) -> Optional[PlannerDay]:
    result = await db.execute(
        select(PlannerDay).where(
            PlannerDay.user_id == user_id, PlannerDay.date == day_date
        )
    )
    return result.scalar_one_or_none()


async def update_planner_day(
    db: AsyncSession, planner_day_id: UUID, user_id: UUID, day_update: PlannerDayUpdate
) -> Optional[PlannerDay]:
    result = await db.execute(
        select(PlannerDay).where(
            PlannerDay.id == planner_day_id, PlannerDay.user_id == user_id
        )
    )
    planner_day = result.scalar_one_or_none()
    if not planner_day:
        return None

    update_data = day_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(planner_day, key, value)

    await db.commit()
    await db.refresh(planner_day)
    return planner_day


async def get_user_planner_days(
    db: AsyncSession, user_id: UUID, start_date: date, end_date: date
) -> List[PlannerDay]:
    result = await db.execute(
        select(PlannerDay)
        .where(
            PlannerDay.user_id == user_id,
            PlannerDay.date >= start_date,
            PlannerDay.date <= end_date,
        )
        .order_by(PlannerDay.date)
    )
    return result.scalars().all()


# Planner Task CRUD
async def create_planner_task(
    db: AsyncSession, user_id: UUID, task: PlannerTaskCreate
) -> PlannerTask:
    db_task = PlannerTask(
        planner_day_id=task.planner_day_id,
        user_id=user_id,
        title=task.title,
        description=task.description,
        start_time=task.start_time,
        end_time=task.end_time,
        color=task.color,
        is_completed=task.is_completed,
        position=task.position,
    )
    db.add(db_task)
    await db.commit()
    await db.refresh(db_task)
    return db_task


async def get_planner_tasks(
    db: AsyncSession, planner_day_id: UUID, user_id: UUID
) -> List[PlannerTask]:
    result = await db.execute(
        select(PlannerTask)
        .where(
            PlannerTask.planner_day_id == planner_day_id, PlannerTask.user_id == user_id
        )
        .order_by(PlannerTask.position)
    )
    return result.scalars().all()


async def update_planner_task(
    db: AsyncSession, task_id: UUID, user_id: UUID, task_update: PlannerTaskUpdate
) -> Optional[PlannerTask]:
    result = await db.execute(
        select(PlannerTask).where(
            PlannerTask.id == task_id, PlannerTask.user_id == user_id
        )
    )
    db_task = result.scalar_one_or_none()
    if not db_task:
        return None

    update_data = task_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_task, key, value)

    await db.commit()
    await db.refresh(db_task)
    return db_task


async def delete_planner_task(db: AsyncSession, task_id: UUID, user_id: UUID) -> bool:
    result = await db.execute(
        select(PlannerTask).where(
            PlannerTask.id == task_id, PlannerTask.user_id == user_id
        )
    )
    db_task = result.scalar_one_or_none()
    if not db_task:
        return False
    await db.delete(db_task)
    await db.commit()
    return True


async def toggle_planner_task(
    db: AsyncSession, task_id: UUID, user_id: UUID
) -> Optional[PlannerTask]:
    result = await db.execute(
        select(PlannerTask).where(
            PlannerTask.id == task_id, PlannerTask.user_id == user_id
        )
    )
    db_task = result.scalar_one_or_none()
    if db_task:
        db_task.is_completed = not db_task.is_completed
        await db.commit()
        await db.refresh(db_task)
    return db_task
