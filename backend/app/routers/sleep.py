from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import List, Optional
from datetime import date
from uuid import UUID
from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
import json

router = APIRouter(prefix="/sleep", tags=["sleep"])


@router.put("/records/{day_date}")
async def update_sleep_record(
    day_date: str,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Обновить запись о сне за конкретный день"""
    try:
        record_date = date.fromisoformat(day_date)
        segments = data.get("segments", [])

        # Проверяем существует ли запись
        check_query = text("""
            SELECT id FROM sleep_records
            WHERE user_id = :user_id AND date = :date
        """)
        result = await db.execute(
            check_query, {"user_id": current_user.id, "date": record_date}
        )
        row = result.fetchone()

        if row:
            # Обновляем существующую
            update_query = text("""
                UPDATE sleep_records
                SET segments = :segments, updated_at = NOW()
                WHERE user_id = :user_id AND date = :date
            """)
            await db.execute(
                update_query,
                {
                    "user_id": current_user.id,
                    "date": record_date,
                    "segments": json.dumps(segments),
                },
            )
        else:
            # Создаем новую
            insert_query = text("""
                INSERT INTO sleep_records (id, user_id, date, segments)
                VALUES (gen_random_uuid(), :user_id, :date, :segments)
            """)
            await db.execute(
                insert_query,
                {
                    "user_id": current_user.id,
                    "date": record_date,
                    "segments": json.dumps(segments),
                },
            )

        await db.commit()
        return {"message": "Sleep record saved successfully"}
    except Exception as e:
        print(f"Error saving sleep record: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/check/{day_date}")
async def check_sleep_record_exists(
    day_date: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Проверить существует ли запись о сне за указанный день"""
    try:
        record_date = date.fromisoformat(day_date)
        query = text("""
            SELECT id FROM sleep_records
            WHERE user_id = :user_id AND date = :date
        """)
        result = await db.execute(
            query, {"user_id": current_user.id, "date": record_date}
        )
        row = result.fetchone()

        if row:
            return {"exists": True, "record_id": str(row[0])}
        return {"exists": False}
    except Exception as e:
        print(f"Error checking sleep record: {e}")
        return {"exists": False}


@router.get("/records/{day_date}")
async def get_sleep_record(
    day_date: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Получить запись о сне за конкретный день"""
    try:
        query = text("""
            SELECT id, date, segments, notes, created_at, updated_at
            FROM sleep_records
            WHERE user_id = :user_id AND date = :date
        """)
        result = await db.execute(
            query, {"user_id": current_user.id, "date": date.fromisoformat(day_date)}
        )
        row = result.fetchone()

        if row:
            return {
                "id": str(row[0]),
                "date": row[1].isoformat(),
                "segments": row[2],
                "notes": row[3],
                "created_at": row[4].isoformat() if row[4] else None,
                "updated_at": row[5].isoformat() if row[5] else None,
            }
        return None
    except Exception as e:
        print(f"Error fetching sleep record: {e}")
        return None


@router.post("/records/{day_date}")
async def save_sleep_record(
    day_date: str,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Сохранить запись о сне за день (создать или обновить)"""
    try:
        record_date = date.fromisoformat(day_date)
        segments = data.get("segments", [])
        notes = data.get("notes", "")

        # Сохраняем сегменты как есть, без нормализации
        # Просто убеждаемся что это список
        if not isinstance(segments, list):
            segments = []

        # Проверяем существует ли запись
        check_query = text("""
            SELECT id FROM sleep_records
            WHERE user_id = :user_id AND date = :date
        """)
        existing = await db.execute(
            check_query, {"user_id": current_user.id, "date": record_date}
        )
        existing_row = existing.fetchone()

        if existing_row:
            # Обновляем существующую запись
            query = text("""
                UPDATE sleep_records
                SET segments = :segments, notes = :notes, updated_at = NOW()
                WHERE user_id = :user_id AND date = :date
                RETURNING id, date, segments, notes, created_at, updated_at
            """)
        else:
            # Создаем новую запись
            query = text("""
                INSERT INTO sleep_records (id, user_id, date, segments, notes)
                VALUES (gen_random_uuid(), :user_id, :date, :segments, :notes)
                RETURNING id, date, segments, notes, created_at, updated_at
            """)

        result = await db.execute(
            query,
            {
                "user_id": current_user.id,
                "date": record_date,
                "segments": json.dumps(segments),
                "notes": notes,
            },
        )
        await db.commit()
        row = result.fetchone()

        return {
            "id": str(row[0]),
            "date": row[1].isoformat(),
            "segments": row[2],
            "notes": row[3],
            "created_at": row[4].isoformat() if row[4] else None,
            "updated_at": row[5].isoformat() if row[5] else None,
        }
    except Exception as e:
        print(f"Error saving sleep record: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/records")
async def get_sleep_records(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Получить все записи о сне за период"""
    try:
        if start_date:
            query = text("""
                SELECT id, date, segments, notes, created_at, updated_at
                FROM sleep_records
                WHERE user_id = :user_id AND date >= :start_date
                ORDER BY date DESC
            """)
            params = {
                "user_id": current_user.id,
                "start_date": date.fromisoformat(start_date.split("T")[0]),
            }
        else:
            query = text("""
                SELECT id, date, segments, notes, created_at, updated_at
                FROM sleep_records
                WHERE user_id = :user_id
                ORDER BY date DESC
            """)
            params = {"user_id": current_user.id}

        result = await db.execute(query, params)
        rows = result.fetchall()

        records = []
        for row in rows:
            records.append(
                {
                    "id": str(row[0]),
                    "date": row[1].isoformat(),
                    "segments": row[2],
                    "notes": row[3],
                    "created_at": row[4].isoformat() if row[4] else None,
                    "updated_at": row[5].isoformat() if row[5] else None,
                }
            )
        return records
    except Exception as e:
        print(f"Error fetching sleep records: {e}")
        return []


@router.delete("/records/{day_date}")
async def delete_sleep_record(
    day_date: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Удалить запись о сне за конкретный день"""
    try:
        query = text("""
            DELETE FROM sleep_records
            WHERE user_id = :user_id AND date = :date
            RETURNING id
        """)
        result = await db.execute(
            query, {"user_id": current_user.id, "date": date.fromisoformat(day_date)}
        )
        await db.commit()
        row = result.fetchone()

        if row:
            return {"message": "Record deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Record not found")
    except Exception as e:
        print(f"Error deleting sleep record: {e}")
        raise HTTPException(status_code=500, detail=str(e))
