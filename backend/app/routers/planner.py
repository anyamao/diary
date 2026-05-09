from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import date, datetime, timedelta
from uuid import UUID
from app.database import get_db
from app import schemas, crud
from app.dependencies import get_current_user
from app.models import User
import json
from sqlalchemy import text

router = APIRouter(prefix="/planner", tags=["planner"])


@router.get("/days/{day_date}")
async def get_planner_day(
    day_date: date,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    planner_day = await crud.get_planner_day(db, current_user.id, day_date)
    if not planner_day:
        planner_day = await crud.get_or_create_planner_day(
            db, current_user.id, day_date
        )

    tasks = await crud.get_planner_tasks(db, planner_day.id, current_user.id)

    return {
        "id": planner_day.id,
        "date": planner_day.date.isoformat(),
        "is_important": planner_day.is_important,
        "notes": planner_day.notes,
        "tasks": [
            {
                "id": t.id,
                "title": t.title,
                "description": t.description,
                "start_time": t.start_time,
                "end_time": t.end_time,
                "color": t.color,
                "is_completed": t.is_completed,
                "position": t.position,
            }
            for t in tasks
        ],
    }


@router.get("/monthly/{year}/{month}")
async def get_monthly_goals(
    year: int,
    month: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        query = text("""
            SELECT monthly_goal, weekly_goals, weekly_notes
            FROM monthly_plans
            WHERE user_id = :user_id AND year = :year AND month = :month
        """)
        result = await db.execute(
            query, {"user_id": current_user.id, "year": year, "month": month}
        )
        row = result.fetchone()

        if row:
            return {
                "monthly_goal": row[0],
                "weekly_goals": row[1] or {},
                "weekly_notes": row[2] or {},
            }
        return {"monthly_goal": "", "weekly_goals": {}, "weekly_notes": {}}
    except Exception as e:
        return {"monthly_goal": "", "weekly_goals": {}, "weekly_notes": {}}


@router.post("/monthly/{year}/{month}")
async def save_monthly_goals(
    year: int,
    month: int,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        check_query = text("""
            SELECT id FROM monthly_plans
            WHERE user_id = :user_id AND year = :year AND month = :month
        """)
        result = await db.execute(
            check_query, {"user_id": current_user.id, "year": year, "month": month}
        )
        existing = result.fetchone()

        if existing:
            update_query = text("""
                UPDATE monthly_plans
                SET monthly_goal = :monthly_goal,
                    weekly_goals = :weekly_goals,
                    weekly_notes = :weekly_notes,
                    updated_at = NOW()
                WHERE user_id = :user_id AND year = :year AND month = :month
            """)
        else:
            update_query = text("""
                INSERT INTO monthly_plans (id, user_id, year, month, monthly_goal, weekly_goals, weekly_notes)
                VALUES (gen_random_uuid(), :user_id, :year, :month, :monthly_goal, :weekly_goals, :weekly_notes)
            """)

        await db.execute(
            update_query,
            {
                "user_id": current_user.id,
                "year": year,
                "month": month,
                "monthly_goal": data.get("monthly_goal", ""),
                "weekly_goals": json.dumps(data.get("weekly_goals", {})),
                "weekly_notes": json.dumps(data.get("weekly_notes", {})),
            },
        )
        await db.commit()
        return {"message": "Saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/days/{day_date}")
async def update_planner_day(
    day_date: date,
    day_update: schemas.PlannerDayUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    planner_day = await crud.get_planner_day(db, current_user.id, day_date)
    if not planner_day:
        planner_day = await crud.get_or_create_planner_day(
            db, current_user.id, day_date
        )

    updated = await crud.update_planner_day(
        db, planner_day.id, current_user.id, day_update
    )
    return {"message": "Updated successfully"}


@router.post("/tasks")
async def create_task(
    task: schemas.PlannerTaskCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await crud.create_planner_task(db, current_user.id, task)


@router.put("/tasks/{task_id}")
async def update_task(
    task_id: UUID,
    task_update: schemas.PlannerTaskUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    task = await crud.update_planner_task(db, task_id, current_user.id, task_update)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.delete("/tasks/{task_id}")
async def delete_task(
    task_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    deleted = await crud.delete_planner_task(db, task_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Deleted successfully"}


@router.patch("/tasks/{task_id}/toggle")
async def toggle_task(
    task_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    task = await crud.toggle_planner_task(db, task_id, current_user.id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.get("/tags")
async def get_tags(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    try:
        query = text("""
            SELECT color, tag_name
            FROM planner_tags
            WHERE user_id = :user_id
        """)
        result = await db.execute(query, {"user_id": current_user.id})
        rows = result.fetchall()

        return [{"color": row[0], "tag_name": row[1]} for row in rows]
    except Exception as e:
        return []


@router.post("/tags")
async def save_tag(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        delete_query = text("""
            DELETE FROM planner_tags
            WHERE user_id = :user_id AND color = :color
        """)
        await db.execute(
            delete_query, {"user_id": current_user.id, "color": data.get("color")}
        )

        insert_query = text("""
            INSERT INTO planner_tags (id, user_id, color, tag_name)
            VALUES (gen_random_uuid(), :user_id, :color, :tag_name)
        """)
        await db.execute(
            insert_query,
            {
                "user_id": current_user.id,
                "color": data.get("color"),
                "tag_name": data.get("tag_name"),
            },
        )
        await db.commit()
        return {"message": "Tag saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/months/{year}/{month}")
async def get_month_days(
    year: int,
    month: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = date(year, month + 1, 1) - timedelta(days=1)

    planner_days = await crud.get_user_planner_days(
        db, current_user.id, start_date, end_date
    )

    days_map = {d.date: d for d in planner_days}
    result = []
    current = start_date
    while current <= end_date:
        planner_day = days_map.get(current)
        result.append(
            {
                "date": current.isoformat(),
                "is_important": planner_day.is_important if planner_day else False,
                "has_tasks": bool(
                    planner_day
                    and await crud.get_planner_tasks(
                        db, planner_day.id, current_user.id
                    )
                ),
            }
        )
        current += timedelta(days=1)

    return result
