from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models import User, RefreshToken, DiaryEntry, ShoppingItem
from app.schemas import UserCreate, DiaryEntryCreate, DiaryEntryUpdate, ShoppingItemCreate
from app.auth import get_password_hash
from datetime import datetime, timedelta
from uuid import UUID
from typing import Optional, List

# User CRUD
async def create_user(db: AsyncSession, user: UserCreate) -> User:
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password,
        full_name=user.full_name
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
async def create_refresh_token(db: AsyncSession, user_id: UUID, token: str, expires_at: datetime) -> RefreshToken:
    db_token = RefreshToken(
        user_id=user_id,
        token=token,
        expires_at=expires_at
    )
    db.add(db_token)
    await db.commit()
    await db.refresh(db_token)
    return db_token

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
async def create_diary_entry(db: AsyncSession, user_id: UUID, entry: DiaryEntryCreate) -> DiaryEntry:
    db_entry = DiaryEntry(
        user_id=user_id,
        title=entry.title,
        content=entry.content,
        mood=entry.mood,
        tags=entry.tags,
        is_favorite=entry.is_favorite
    )
    db.add(db_entry)
    await db.commit()
    await db.refresh(db_entry)
    return db_entry

async def get_user_diary_entries(db: AsyncSession, user_id: UUID, skip: int = 0, limit: int = 50) -> List[DiaryEntry]:
    result = await db.execute(
        select(DiaryEntry)
        .where(DiaryEntry.user_id == user_id)
        .order_by(DiaryEntry.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()

async def get_diary_entry(db: AsyncSession, entry_id: UUID, user_id: UUID) -> Optional[DiaryEntry]:
    result = await db.execute(
        select(DiaryEntry).where(
            DiaryEntry.id == entry_id,
            DiaryEntry.user_id == user_id
        )
    )
    return result.scalar_one_or_none()

async def update_diary_entry(db: AsyncSession, entry_id: UUID, user_id: UUID, entry_update: DiaryEntryUpdate) -> Optional[DiaryEntry]:
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
async def create_shopping_item(db: AsyncSession, user_id: UUID, item: ShoppingItemCreate) -> ShoppingItem:
    db_item = ShoppingItem(
        user_id=user_id,
        name=item.name,
        quantity=item.quantity,
        unit=item.unit,
        category=item.category
    )
    db.add(db_item)
    await db.commit()
    await db.refresh(db_item)
    return db_item

async def get_user_shopping_items(db: AsyncSession, user_id: UUID, completed: Optional[bool] = None) -> List[ShoppingItem]:
    query = select(ShoppingItem).where(ShoppingItem.user_id == user_id)
    if completed is not None:
        query = query.where(ShoppingItem.is_completed == completed)
    result = await db.execute(query.order_by(ShoppingItem.created_at.desc()))
    return result.scalars().all()

async def toggle_shopping_item(db: AsyncSession, item_id: UUID, user_id: UUID) -> Optional[ShoppingItem]:
    result = await db.execute(
        select(ShoppingItem).where(
            ShoppingItem.id == item_id,
            ShoppingItem.user_id == user_id
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
            ShoppingItem.id == item_id,
            ShoppingItem.user_id == user_id
        )
    )
    db_item = result.scalar_one_or_none()
    if not db_item:
        return False
    await db.delete(db_item)
    await db.commit()
    return True
