from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID
from app.database import get_db
from app import schemas, crud
from app.dependencies import get_current_user
from app.models import User

router = APIRouter(prefix="/diary", tags=["diary"])

@router.post("/entries", response_model=schemas.DiaryEntryResponse, status_code=status.HTTP_201_CREATED)
async def create_entry(
    entry: schemas.DiaryEntryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await crud.create_diary_entry(db, current_user.id, entry)

@router.get("/entries", response_model=List[schemas.DiaryEntryResponse])
async def get_entries(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await crud.get_user_diary_entries(db, current_user.id, skip, limit)

@router.get("/entries/{entry_id}", response_model=schemas.DiaryEntryResponse)
async def get_entry(
    entry_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
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
    db: AsyncSession = Depends(get_db)
):
    entry = await crud.update_diary_entry(db, entry_id, current_user.id, entry_update)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    return entry

@router.delete("/entries/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_entry(
    entry_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    deleted = await crud.delete_diary_entry(db, entry_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Entry not found")

# Shopping list endpoints
@router.post("/shopping", response_model=schemas.ShoppingItemResponse)
async def create_shopping_item(
    item: schemas.ShoppingItemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await crud.create_shopping_item(db, current_user.id, item)

@router.get("/shopping", response_model=List[schemas.ShoppingItemResponse])
async def get_shopping_items(
    completed: bool = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await crud.get_user_shopping_items(db, current_user.id, completed)

@router.patch("/shopping/{item_id}/toggle", response_model=schemas.ShoppingItemResponse)
async def toggle_shopping_item(
    item_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    item = await crud.toggle_shopping_item(db, item_id, current_user.id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@router.delete("/shopping/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_shopping_item(
    item_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    deleted = await crud.delete_shopping_item(db, item_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Item not found")
