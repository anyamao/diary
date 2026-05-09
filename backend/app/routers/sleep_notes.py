from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID
from app.database import get_db
from app import schemas, crud
from app.dependencies import get_current_user
from app.models import User

router = APIRouter(prefix="/sleep-notes", tags=["sleep-notes"])


@router.get("/all", response_model=List[schemas.SleepNoteResponse])
async def get_all_sleep_notes(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """Получить все заметки о снах пользователя"""
    return await crud.get_all_sleep_notes(db, current_user.id)


@router.post(
    "/", response_model=schemas.SleepNoteResponse, status_code=status.HTTP_201_CREATED
)
async def create_sleep_note(
    note: schemas.SleepNoteCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await crud.create_sleep_note(db, current_user.id, note)


@router.get("/record/{sleep_record_id}", response_model=List[schemas.SleepNoteResponse])
async def get_sleep_notes_by_record(
    sleep_record_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await crud.get_sleep_notes_by_record(db, sleep_record_id, current_user.id)


@router.get("/{note_id}", response_model=schemas.SleepNoteResponse)
async def get_sleep_note(
    note_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    note = await crud.get_sleep_note(db, note_id, current_user.id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.put("/{note_id}", response_model=schemas.SleepNoteResponse)
async def update_sleep_note(
    note_id: UUID,
    note_update: schemas.SleepNoteUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    note = await crud.update_sleep_note(db, note_id, current_user.id, note_update)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sleep_note(
    note_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    deleted = await crud.delete_sleep_note(db, note_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Note not found")
