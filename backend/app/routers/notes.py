from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from uuid import UUID
from app.database import get_db
from app import schemas, crud
from app.dependencies import get_current_user
from app.models import User

router = APIRouter(prefix="/business-notes", tags=["business-notes"])


@router.post(
    "/",
    response_model=schemas.BusinessNoteResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_note(
    note: schemas.BusinessNoteCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await crud.create_business_note(db, current_user.id, note)


@router.get("/", response_model=List[schemas.BusinessNoteResponse])
async def get_notes(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    tag: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await crud.get_user_business_notes(db, current_user.id, skip, limit, tag)


@router.get("/{note_id}", response_model=schemas.BusinessNoteResponse)
async def get_note(
    note_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    note = await crud.get_business_note(db, note_id, current_user.id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.put("/{note_id}", response_model=schemas.BusinessNoteResponse)
async def update_note(
    note_id: UUID,
    note_update: schemas.BusinessNoteUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    note = await crud.update_business_note(db, note_id, current_user.id, note_update)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    deleted = await crud.delete_business_note(db, note_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Note not found")


@router.patch("/{note_id}/pin", response_model=schemas.BusinessNoteResponse)
async def toggle_pin(
    note_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    note = await crud.toggle_pin_business_note(db, note_id, current_user.id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.get("/tags/all")
async def get_all_tags(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    notes = await crud.get_user_business_notes(db, current_user.id, limit=1000)
    tags_set = set()
    for note in notes:
        if note.tags:
            for tag in note.tags.split(","):
                tag = tag.strip()
                if tag:
                    tags_set.add(tag)
    return sorted(list(tags_set))
