from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import List, Dict
from uuid import UUID
from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
import json

router = APIRouter(prefix="/color-tags", tags=["color-tags"])


@router.get("/")
async def get_all_tags(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """Получить все теги пользователя для цветов"""
    try:
        query = text("""
            SELECT color_name, tag_name, created_at, updated_at
            FROM color_tags
            WHERE user_id = :user_id
            ORDER BY created_at
        """)
        result = await db.execute(query, {"user_id": current_user.id})
        rows = result.fetchall()

        tags = {}
        for row in rows:
            tags[row[0]] = row[1]

        return tags
    except Exception as e:
        print(f"Error getting tags: {e}")
        return {}


@router.post("/{color_name}")
async def save_tag(
    color_name: str,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Сохранить тег для конкретного цвета"""
    try:
        tag_name = data.get("tag_name", "").strip()
        if not tag_name:
            raise HTTPException(status_code=400, detail="Tag name is required")

        # Удаляем старый тег для этого цвета
        delete_query = text("""
            DELETE FROM color_tags
            WHERE user_id = :user_id AND color_name = :color_name
        """)
        await db.execute(
            delete_query, {"user_id": current_user.id, "color_name": color_name}
        )

        # Добавляем новый
        insert_query = text("""
            INSERT INTO color_tags (id, user_id, color_name, tag_name)
            VALUES (gen_random_uuid(), :user_id, :color_name, :tag_name)
        """)
        await db.execute(
            insert_query,
            {
                "user_id": current_user.id,
                "color_name": color_name,
                "tag_name": tag_name,
            },
        )
        await db.commit()

        return {"message": "Tag saved successfully", "tag_name": tag_name}
    except Exception as e:
        print(f"Error saving tag: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{color_name}")
async def delete_tag(
    color_name: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Удалить тег для цвета"""
    try:
        delete_query = text("""
            DELETE FROM color_tags
            WHERE user_id = :user_id AND color_name = :color_name
        """)
        result = await db.execute(
            delete_query, {"user_id": current_user.id, "color_name": color_name}
        )
        await db.commit()

        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Tag not found")

        return {"message": "Tag deleted successfully"}
    except Exception as e:
        print(f"Error deleting tag: {e}")
        raise HTTPException(status_code=500, detail=str(e))
