import psycopg2
from sqlalchemy import (
    create_engine,
    MetaData,
    Table,
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    Text,
    JSONB,
    UUID,
    Date,
    ForeignKey,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.sql import func
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://postgres:postgres123@localhost:5432/diary"
)
sync_url = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
engine = create_engine(sync_url)

sql_statements = [
    """
    CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        username VARCHAR(50) NOT NULL UNIQUE,
        hashed_password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100),
        role VARCHAR(20) DEFAULT 'user',
        is_active BOOLEAN DEFAULT TRUE,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE,
        last_login TIMESTAMP WITH TIME ZONE
    )
    """,
    """
    CREATE INDEX IF NOT EXISTS idx_user_email ON users(email)
    """,
    """
    CREATE INDEX IF NOT EXISTS idx_user_username ON users(username)
    """,
    """
    CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(500) NOT NULL UNIQUE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        revoked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS diary_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        content TEXT,
        mood VARCHAR(50),
        tags VARCHAR(500),
        is_favorite BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE
    )
    """,
    """
    CREATE INDEX IF NOT EXISTS idx_diary_user_id ON diary_entries(user_id)
    """,
    """
    CREATE INDEX IF NOT EXISTS idx_diary_created ON diary_entries(created_at)
    """,
    """
    CREATE TABLE IF NOT EXISTS shopping_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(200) NOT NULL,
        quantity INTEGER DEFAULT 1,
        unit VARCHAR(50),
        is_completed BOOLEAN DEFAULT FALSE,
        category VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
    """,
    """
    CREATE INDEX IF NOT EXISTS idx_shopping_user_id ON shopping_items(user_id)
    """,
    """
    CREATE TABLE IF NOT EXISTS sleep_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        segments JSONB DEFAULT '[]',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, date)
    )
    """,
    """
    CREATE INDEX IF NOT EXISTS idx_sleep_user_date ON sleep_records(user_id, date)
    """,
    """
    CREATE TABLE IF NOT EXISTS sleep_notes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sleep_record_id UUID NOT NULL REFERENCES sleep_records(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        content TEXT,
        dream_type VARCHAR(50),
        wake_mood VARCHAR(50),
        tags JSONB DEFAULT '[]',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
    """,
    """
    CREATE INDEX IF NOT EXISTS idx_sleep_note_record ON sleep_notes(sleep_record_id)
    """,
    """
    CREATE INDEX IF NOT EXISTS idx_sleep_note_user ON sleep_notes(user_id)
    """,
    """
    CREATE TABLE IF NOT EXISTS mood_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        text VARCHAR(500) NOT NULL,
        type VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
    """,
    """
    CREATE INDEX IF NOT EXISTS idx_mood_user_type ON mood_items(user_id, type)
    """,
    """
    CREATE TABLE IF NOT EXISTS personality_test_results (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        result TEXT NOT NULL,
        scores JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
    """,
    """
    CREATE INDEX IF NOT EXISTS idx_personality_test_user ON personality_test_results(user_id)
    """,
    """
    CREATE TABLE IF NOT EXISTS depression_test_results (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        total_score INTEGER NOT NULL,
        severity VARCHAR(100) NOT NULL,
        result TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
    """,
    """
    CREATE INDEX IF NOT EXISTS idx_depression_test_user ON depression_test_results(user_id)
    """,
    """
    CREATE TABLE IF NOT EXISTS self_notes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        content TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
    """,
    """
    CREATE INDEX IF NOT EXISTS idx_self_notes_user ON self_notes(user_id)
    """,
]

print("Создание таблиц...")
with engine.connect() as conn:
    for sql in sql_statements:
        try:
            conn.execute(sql)
            conn.commit()
            print(f"✅ Выполнено: {sql[:50]}...")
        except Exception as e:
            print(f"⚠️ Ошибка (игнорируем если таблица уже есть): {e}")

engine.dispose()
