from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import List, Dict, Optional
from uuid import UUID
from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
import json

router = APIRouter(prefix="/personality", tags=["personality"])


@router.get("/self-notes")
async def get_self_notes(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    try:
        query = text("""
            SELECT id, title, content, created_at, updated_at
            FROM self_notes
            WHERE user_id = :user_id
            ORDER BY created_at DESC
        """)
        result = await db.execute(query, {"user_id": current_user.id})
        rows = result.fetchall()

        notes = []
        for row in rows:
            notes.append(
                {
                    "id": str(row[0]),
                    "title": row[1],
                    "content": row[2] or "",
                    "created_at": row[3].isoformat(),
                    "updated_at": row[4].isoformat() if row[4] else None,
                }
            )
        return notes
    except Exception as e:
        print(f"Error getting self notes: {e}")
        return []


@router.post("/self-notes")
async def create_self_note(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        insert_query = text("""
            INSERT INTO self_notes (id, user_id, title, content)
            VALUES (gen_random_uuid(), :user_id, :title, :content)
        """)
        await db.execute(
            insert_query,
            {
                "user_id": current_user.id,
                "title": data.get("title"),
                "content": data.get("content", ""),
            },
        )
        await db.commit()
        return {"message": "Note created successfully"}
    except Exception as e:
        print(f"Error creating self note: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/self-notes/{note_id}")
async def update_self_note(
    note_id: str,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        update_query = text("""
            UPDATE self_notes
            SET title = :title, content = :content, updated_at = NOW()
            WHERE id = :note_id AND user_id = :user_id
        """)
        result = await db.execute(
            update_query,
            {
                "note_id": UUID(note_id),
                "user_id": current_user.id,
                "title": data.get("title"),
                "content": data.get("content", ""),
            },
        )
        await db.commit()
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Note not found")
        return {"message": "Note updated successfully"}
    except Exception as e:
        print(f"Error updating self note: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/self-notes/{note_id}")
async def delete_self_note(
    note_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        delete_query = text("""
            DELETE FROM self_notes
            WHERE id = :note_id AND user_id = :user_id
        """)
        result = await db.execute(
            delete_query, {"note_id": UUID(note_id), "user_id": current_user.id}
        )
        await db.commit()
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Note not found")
        return {"message": "Note deleted successfully"}
    except Exception as e:
        print(f"Error deleting self note: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Mood items endpoints
@router.get("/mood-items")
async def get_mood_items(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    try:
        query = text("""
            SELECT id, text, type, created_at
            FROM mood_items
            WHERE user_id = :user_id
            ORDER BY created_at DESC
        """)
        result = await db.execute(query, {"user_id": current_user.id})
        rows = result.fetchall()

        boosters = []
        drainers = []
        for row in rows:
            item = {
                "id": str(row[0]),
                "text": row[1],
                "type": row[2],
                "created_at": row[3].isoformat(),
            }
            if row[2] == "booster":
                boosters.append(item)
            else:
                drainers.append(item)

        return {"boosters": boosters, "drainers": drainers}
    except Exception as e:
        print(f"Error getting mood items: {e}")
        return {"boosters": [], "drainers": []}


@router.post("/mood-items")
async def save_mood_items(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        delete_query = text("DELETE FROM mood_items WHERE user_id = :user_id")
        await db.execute(delete_query, {"user_id": current_user.id})

        boosters = data.get("boosters", [])
        drainers = data.get("drainers", [])

        for item in boosters:
            insert_query = text("""
                INSERT INTO mood_items (id, user_id, text, type)
                VALUES (gen_random_uuid(), :user_id, :text, 'booster')
            """)
            await db.execute(
                insert_query, {"user_id": current_user.id, "text": item["text"]}
            )

        for item in drainers:
            insert_query = text("""
                INSERT INTO mood_items (id, user_id, text, type)
                VALUES (gen_random_uuid(), :user_id, :text, 'drainer')
            """)
            await db.execute(
                insert_query, {"user_id": current_user.id, "text": item["text"]}
            )

        await db.commit()
        return {"message": "Saved successfully"}
    except Exception as e:
        print(f"Error saving mood items: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/personality-test/result")
async def save_personality_test_result(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        test_type = data.get("test_type", "big5")
        result_data = data.get("result")
        scores_data = data.get("scores")

        print(f"=== SAVING RESULT ===")
        print(f"test_type: {test_type}")
        print(f"result: {result_data[:100] if result_data else None}...")
        print(f"scores: {scores_data}")

        # Удаляем старый результат для этого типа теста
        delete_query = text(
            "DELETE FROM personality_test_results WHERE user_id = :user_id AND test_type = :test_type"
        )
        await db.execute(
            delete_query, {"user_id": current_user.id, "test_type": test_type}
        )

        # Сохраняем новый
        insert_query = text("""
            INSERT INTO personality_test_results (id, user_id, result, scores, test_type)
            VALUES (gen_random_uuid(), :user_id, :result, :scores, :test_type)
        """)
        await db.execute(
            insert_query,
            {
                "user_id": current_user.id,
                "result": result_data,
                "scores": scores_data,
                "test_type": test_type,
            },
        )
        await db.commit()

        # Проверяем, что сохранилось
        check_query = text("""
            SELECT id, test_type, result, scores 
            FROM personality_test_results 
            WHERE user_id = :user_id AND test_type = :test_type
        """)
        check_result = await db.execute(
            check_query, {"user_id": current_user.id, "test_type": test_type}
        )
        row = check_result.fetchone()
        if row:
            print(f"✅ Successfully saved! ID: {row[0]}, test_type: {row[1]}")
        else:
            print(f"❌ Failed to verify save!")

        return {"message": "Saved successfully"}
    except Exception as e:
        print(f"Error saving personality test result: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/personality-test/result")
async def get_personality_test_result(
    current_user: User = Depends(get_current_user),
    test: str = Query(
        "big5", description="Test type: big5, emotional_intelligence, motivation"
    ),
    db: AsyncSession = Depends(get_db),
):
    try:
        print(f"=== GETTING RESULT ===")
        print(f"test parameter: '{test}'")
        print(f"test type: {type(test)}")

        query = text("""
            SELECT result, scores, created_at
            FROM personality_test_results
            WHERE user_id = :user_id AND test_type = :test_type
            ORDER BY created_at DESC
            LIMIT 1
        """)
        result = await db.execute(
            query, {"user_id": current_user.id, "test_type": test}
        )
        row = result.fetchone()

        if row:
            print(f"✅ Found result for {test}")
            return {
                "has_result": True,
                "result": row[0],
                "scores": row[1],
                "created_at": row[2].isoformat(),
            }
        print(f"❌ No result found for {test}")
        return {"has_result": False}
    except Exception as e:
        print(f"Error: {e}")
        return {"has_result": False}


# Depression test endpoints
@router.get("/depression-test/result")
async def get_depression_test_result(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    try:
        query = text("""
            SELECT total_score, severity, result, created_at
            FROM depression_test_results
            WHERE user_id = :user_id
            ORDER BY created_at DESC
            LIMIT 1
        """)
        result = await db.execute(query, {"user_id": current_user.id})
        row = result.fetchone()

        if row:
            return {
                "has_result": True,
                "total_score": row[0],
                "severity": row[1],
                "result": row[2],
                "created_at": row[3].isoformat(),
            }
        return {"has_result": False}
    except Exception as e:
        print(f"Error getting depression test result: {e}")
        return {"has_result": False}


@router.post("/depression-test/result")
async def save_depression_test_result(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        # Удаляем старый результат
        delete_query = text(
            "DELETE FROM depression_test_results WHERE user_id = :user_id"
        )
        await db.execute(delete_query, {"user_id": current_user.id})

        # Сохраняем новый
        insert_query = text("""
            INSERT INTO depression_test_results (id, user_id, total_score, severity, result)
            VALUES (gen_random_uuid(), :user_id, :total_score, :severity, :result)
        """)
        await db.execute(
            insert_query,
            {
                "user_id": current_user.id,
                "total_score": data.get("total_score"),
                "severity": data.get("severity"),
                "result": data.get("result"),
            },
        )
        await db.commit()
        return {"message": "Saved successfully"}
    except Exception as e:
        print(f"Error saving depression test result: {e}")
        raise HTTPException(status_code=500, detail=str(e))
