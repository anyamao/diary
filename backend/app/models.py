from sqlalchemy import (
    Column,
    String,
    DateTime,
    Boolean,
    Enum,
    Integer,
    Text,
    Index,
    Float,
    Date,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from app.database import Base
import uuid
import enum


class PersonalityTestResult(Base):
    __tablename__ = "personality_test_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    result = Column(Text, nullable=False)
    scores = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (Index("idx_personality_test_user", "user_id"),)


class DepressionTestResult(Base):
    __tablename__ = "depression_test_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    total_score = Column(Integer, nullable=False)
    severity = Column(String(100), nullable=False)
    result = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (Index("idx_depression_test_user", "user_id"),)


class SelfNote(Base):
    __tablename__ = "self_notes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (Index("idx_self_notes_user", "user_id"),)


class MoodItem(Base):
    __tablename__ = "mood_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    text = Column(String(500), nullable=False)
    type = Column(String(50), nullable=False)  # 'booster' or 'drainer'
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (Index("idx_mood_user_type", "user_id", "type"),)


class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"


class SleepNote(Base):
    __tablename__ = "sleep_notes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sleep_record_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=True)
    dream_type = Column(
        String(50), nullable=True
    )  # nightmare, normal, love, sad, happy
    wake_mood = Column(String(50), nullable=True)  # sad, happy, scared, neutral
    tags = Column(JSONB, default=list)  # массив тегов
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        Index("idx_sleep_note_record", "sleep_record_id"),
        Index("idx_sleep_note_user", "user_id"),
    )


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=True)
    role = Column(Enum(UserRole), default=UserRole.USER)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("idx_user_email", "email"),
        Index("idx_user_username", "username"),
    )


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    token = Column(String(500), unique=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SleepRecord(Base):
    __tablename__ = "sleep_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    date = Column(DateTime, nullable=False, index=True)
    sleep_start = Column(DateTime, nullable=False)
    sleep_end = Column(DateTime, nullable=False)
    duration_hours = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (Index("idx_sleep_user_date", "user_id", "date"),)


class DiaryEntry(Base):
    __tablename__ = "diary_entries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=True)
    mood = Column(String(50), nullable=True)
    tags = Column(String(500), nullable=True)
    is_favorite = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        Index("idx_diary_user_id", "user_id"),
        Index("idx_diary_created", "created_at"),
    )


class ShoppingItem(Base):
    __tablename__ = "shopping_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    quantity = Column(Integer, default=1)
    unit = Column(String(50), nullable=True)
    is_completed = Column(Boolean, default=False)
    category = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("idx_shopping_user_id", "user_id"),
        Index("idx_shopping_completed", "is_completed"),
    )
