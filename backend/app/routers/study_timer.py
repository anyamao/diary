from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from uuid import UUID
from app.database import get_db
from app import schemas, crud
from app.dependencies import get_current_user
from app.models import User
import json

router = APIRouter(prefix="/study-timer", tags=["study-timer"])


@router.patch("/current/description")
async def update_current_session_description(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Обновить описание текущей активной сессии"""
    session = await crud.get_current_session(db, current_user.id)
    if not session:
        raise HTTPException(status_code=404, detail="No active session found")

    await crud.update_session_description(db, session.id, data.get("description", ""))
    return {"message": "Description updated"}


def get_utc_now():
    return datetime.now(timezone.utc)


@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Удалить сессию по ID"""
    try:
        query = text("""
            DELETE FROM study_timer_sessions
            WHERE id = :session_id AND user_id = :user_id
            RETURNING id
        """)
        result = await db.execute(
            query, {"session_id": session_id, "user_id": current_user.id}
        )
        await db.commit()

        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Session not found")

        return {"message": "Session deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/monthly/{year}/{month}")
async def get_monthly_stats(
    year: int,
    month: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Получить статистику за месяц"""
    from sqlalchemy import text

    query = text("""
        SELECT 
            COUNT(*) as total_sessions,
            SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600) as total_hours,
            AVG(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600) as avg_session_hours,
            COUNT(DISTINCT DATE(start_time)) as days_with_study,
            MAX(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600) as max_duration,
            (
                SELECT DATE(start_time) 
                FROM study_timer_sessions s2 
                WHERE s2.user_id = :user_id 
                    AND EXTRACT(YEAR FROM s2.start_time) = :year 
                    AND EXTRACT(MONTH FROM s2.start_time) = :month
                    AND s2.end_time IS NOT NULL
                GROUP BY DATE(start_time)
                ORDER BY SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600) DESC
                LIMIT 1
            ) as best_day,
            (
                SELECT SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600)
                FROM study_timer_sessions s2 
                WHERE s2.user_id = :user_id 
                    AND EXTRACT(YEAR FROM s2.start_time) = :year 
                    AND EXTRACT(MONTH FROM s2.start_time) = :month
                    AND s2.end_time IS NOT NULL
                GROUP BY DATE(start_time)
                ORDER BY SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600) DESC
                LIMIT 1
            ) as best_day_hours
        FROM study_timer_sessions
        WHERE user_id = :user_id 
            AND EXTRACT(YEAR FROM start_time) = :year 
            AND EXTRACT(MONTH FROM start_time) = :month
            AND end_time IS NOT NULL
    """)

    result = await db.execute(
        query, {"user_id": current_user.id, "year": year, "month": month}
    )
    row = result.fetchone()

    tags_query = text("""
        SELECT 
            tag,
            SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600) as hours
        FROM study_timer_sessions
        WHERE user_id = :user_id 
            AND EXTRACT(YEAR FROM start_time) = :year 
            AND EXTRACT(MONTH FROM start_time) = :month
            AND end_time IS NOT NULL
        GROUP BY tag
        ORDER BY hours DESC
    """)

    tags_result = await db.execute(
        tags_query, {"user_id": current_user.id, "year": year, "month": month}
    )
    tags_rows = tags_result.fetchall()

    return {
        "total_sessions": row[0] or 0,
        "total_hours": round(row[1] or 0, 1),
        "avg_session_hours": round(row[2] or 0, 1),
        "days_with_study": row[3] or 0,
        "total_days_in_month": 31,
        "max_duration": round(row[4] or 0, 1),
        "best_day": row[5].isoformat() if row[5] else None,
        "best_day_hours": round(row[6] or 0, 1),
        "tags": [{"tag": t[0], "hours": round(t[1], 1)} for t in tags_rows],
    }


@router.get("/stats/all")
async def get_all_time_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Получить статистику за всё время"""
    from sqlalchemy import text

    query = text("""
        SELECT 
            COUNT(*) as total_sessions,
            SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600) as total_hours,
            AVG(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600) as avg_session_hours,
            COUNT(DISTINCT DATE(start_time)) as days_with_study,
            MIN(DATE(start_time)) as first_study_day,
            MAX(DATE(start_time)) as last_study_day,
            MAX(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600) as max_duration,
            (
                SELECT DATE(start_time) 
                FROM study_timer_sessions s2 
                WHERE s2.user_id = :user_id 
                    AND s2.end_time IS NOT NULL
                GROUP BY DATE(start_time)
                ORDER BY SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600) DESC
                LIMIT 1
            ) as best_day,
            (
                SELECT SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600)
                FROM study_timer_sessions s2 
                WHERE s2.user_id = :user_id 
                    AND s2.end_time IS NOT NULL
                GROUP BY DATE(start_time)
                ORDER BY SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600) DESC
                LIMIT 1
            ) as best_day_hours
        FROM study_timer_sessions
        WHERE user_id = :user_id 
            AND end_time IS NOT NULL
    """)

    result = await db.execute(query, {"user_id": current_user.id})
    row = result.fetchone()

    tags_query = text("""
        SELECT 
            tag,
            SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600) as hours
        FROM study_timer_sessions
        WHERE user_id = :user_id 
            AND end_time IS NOT NULL
        GROUP BY tag
        ORDER BY hours DESC
    """)

    tags_result = await db.execute(tags_query, {"user_id": current_user.id})
    tags_rows = tags_result.fetchall()

    return {
        "total_sessions": row[0] or 0,
        "total_hours": round(row[1] or 0, 1),
        "avg_session_hours": round(row[2] or 0, 1),
        "days_with_study": row[3] or 0,
        "first_study_day": row[4].isoformat() if row[4] else None,
        "last_study_day": row[5].isoformat() if row[5] else None,
        "max_duration": round(row[6] or 0, 1),
        "best_day": row[7].isoformat() if row[7] else None,
        "best_day_hours": round(row[8] or 0, 1),
        "tags": [{"tag": t[0], "hours": round(t[1], 1)} for t in tags_rows],
    }


@router.put("/sessions/{session_id}")
async def update_session(
    session_id: UUID,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Обновить существующую сессию (тег и описание)"""
    try:
        query = text("""
            SELECT id, user_id FROM study_timer_sessions
            WHERE id = :session_id AND user_id = :user_id
        """)
        result = await db.execute(
            query, {"session_id": session_id, "user_id": current_user.id}
        )
        session = result.fetchone()

        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        update_query = text("""
            UPDATE study_timer_sessions
            SET tag = :tag, description = :description, updated_at = NOW()
            WHERE id = :session_id AND user_id = :user_id
        """)
        await db.execute(
            update_query,
            {
                "session_id": session_id,
                "user_id": current_user.id,
                "tag": data.get("tag"),
                "description": data.get("description"),
            },
        )
        await db.commit()

        return {"message": "Session updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/start", response_model=schemas.StudyTimerSessionResponse)
async def start_session(
    data: schemas.StudyTimerSessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await crud.start_timer_session(
        db, current_user.id, data.tag, data.description, get_utc_now()
    )


@router.post("/stop", response_model=schemas.StudyTimerSessionResponse)
async def stop_session(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    session = await crud.stop_current_session(db, current_user.id, get_utc_now())
    if not session:
        raise HTTPException(status_code=404, detail="No active session found")
    return session


@router.get("/current")
async def get_current_session(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    session = await crud.get_current_session(db, current_user.id)
    if not session:
        return {"is_active": False}

    now = get_utc_now()
    elapsed = int((now - session.start_time).total_seconds())

    return {
        "is_active": True,
        "id": str(session.id),
        "tag": session.tag,
        "description": session.description,
        "start_time": session.start_time.isoformat(),
        "elapsed_seconds": elapsed,
    }


@router.get("/stats")
async def get_stats(
    period: str = Query("week", regex="^(week|month|all|custom)$"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    now = get_utc_now()
    start = None
    end = now

    if period == "week":
        start = now - timedelta(days=7)
    elif period == "month":
        start = now - timedelta(days=30)
    elif period == "custom" and start_date:
        start = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
        if end_date:
            end = datetime.fromisoformat(end_date.replace("Z", "+00:00"))

    sessions = await crud.get_timer_stats(db, current_user.id, start, end)

    stats_by_tag = {}
    total_seconds = 0

    for session in sessions:
        if session.duration_seconds:
            stats_by_tag[session.tag] = (
                stats_by_tag.get(session.tag, 0) + session.duration_seconds
            )
            total_seconds += session.duration_seconds

    return {
        "total_hours": round(total_seconds / 3600, 1),
        "total_minutes": round(total_seconds / 60, 1),
        "by_tag": {
            tag: round(seconds / 3600, 1) for tag, seconds in stats_by_tag.items()
        },
        "sessions": [
            {
                "id": str(s.id),
                "tag": s.tag,
                "description": s.description,
                "duration_hours": round(s.duration_seconds / 3600, 1)
                if s.duration_seconds
                else 0,
                "start_time": s.start_time.isoformat(),
                "end_time": s.end_time.isoformat() if s.end_time else None,
            }
            for s in sessions
        ],
    }


@router.get("/activity/{year}/{month}")
async def get_activity_by_month(
    year: int,
    month: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Получить количество часов учёбы по дням месяца"""
    from sqlalchemy import text

    query = text("""
        SELECT 
            DATE(s.start_time) as date,
            SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600) as total_hours
        FROM study_timer_sessions s
        WHERE s.user_id = :user_id 
            AND EXTRACT(YEAR FROM s.start_time) = :year
            AND EXTRACT(MONTH FROM s.start_time) = :month
            AND s.end_time IS NOT NULL
        GROUP BY DATE(s.start_time)
    """)

    result = await db.execute(
        query, {"user_id": current_user.id, "year": year, "month": month}
    )
    rows = result.fetchall()

    return {row[0].isoformat(): float(row[1]) for row in rows}


@router.get("/sessions/day/{date_str}")
async def get_sessions_by_day(
    date_str: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Получить все сессии за конкретный день"""
    from sqlalchemy import text
    from datetime import date

    try:
        target_date = date.fromisoformat(date_str)

        query = text("""
            SELECT 
                id, tag, description, start_time, end_time,
                EXTRACT(EPOCH FROM (end_time - start_time)) / 3600 as duration_hours
            FROM study_timer_sessions
            WHERE user_id = :user_id 
                AND DATE(start_time) = :target_date
                AND end_time IS NOT NULL
            ORDER BY start_time ASC
        """)

        result = await db.execute(
            query, {"user_id": current_user.id, "target_date": target_date}
        )
        rows = result.fetchall()

        return [
            {
                "id": row[0],
                "tag": row[1],
                "description": row[2],
                "start_time": row[3].isoformat(),
                "end_time": row[4].isoformat(),
                "duration_hours": round(row[5], 1),
            }
            for row in rows
        ]
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tags", response_model=List[schemas.TimerTagResponse])
async def get_tags(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    return await crud.get_timer_tags(db, current_user.id)


@router.post("/tags", response_model=schemas.TimerTagResponse)
async def create_tag(
    data: schemas.TimerTagCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await crud.create_timer_tag(db, current_user.id, data.name, data.color)


@router.delete("/tags/{tag_id}")
async def delete_tag(
    tag_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    deleted = await crud.delete_timer_tag(db, current_user.id, tag_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Tag not found")
    return {"message": "Tag deleted"}
