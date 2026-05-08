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
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from app.database import Base
import uuid
import enum


class ColorTag(Base):
    __tablename__ = "color_tags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    color_name = Column(String(50), nullable=False)  # yellow, blue, green, etc.
    tag_name = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        Index("idx_color_tag_user", "user_id"),
        Index("idx_color_tag_color", "color_name"),
        UniqueConstraint("user_id", "color_name", name="unique_user_color"),
    )


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(
        String(50), nullable=False
    )  # 'info', 'warning', 'success', 'celebrate'
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("idx_notification_user", "user_id"),
        Index("idx_notification_read", "is_read"),
    )


class PersonalityTestResult(Base):
    __tablename__ = "personality_test_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    result = Column(Text, nullable=False)
    scores = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (Index("idx_personality_test_user", "user_id"),)


class StudyTimerSession(Base):
    __tablename__ = "study_timer_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    tag = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        Index("idx_timer_user_active", "user_id", "is_active"),
        Index("idx_timer_user_tag", "user_id", "tag"),
        Index("idx_timer_user_date", "user_id", "start_time"),
    )


class TimerTag(Base):
    __tablename__ = "timer_tags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    color = Column(String(20), default="blue")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("idx_timer_tag_user", "user_id"),
        UniqueConstraint("user_id", "name", name="unique_timer_tag"),
    )


class BusinessNote(Base):
    __tablename__ = "business_notes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=True)
    tags = Column(String(500), nullable=True)  # теги через запятую
    is_pinned = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        Index("idx_business_note_user", "user_id"),
        Index("idx_business_note_pinned", "is_pinned"),
        Index("idx_business_note_created", "created_at"),
    )


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


class PlannerDay(Base):
    __tablename__ = "planner_days"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    is_important = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        Index("idx_planner_user_date", "user_id", "date"),
        UniqueConstraint("user_id", "date", name="unique_planner_date"),
    )


class PlannerTask(Base):
    __tablename__ = "planner_tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    planner_day_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    start_time = Column(String(10), nullable=True)  # HH:MM формат
    end_time = Column(String(10), nullable=True)  # HH:MM формат
    color = Column(
        String(20), default="yellow"
    )  # yellow, blue, green, purple, pink, orange
    is_completed = Column(Boolean, default=False)
    position = Column(Integer, default=0)  # порядок отображения
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        Index("idx_planner_task_day", "planner_day_id"),
        Index("idx_planner_task_user", "user_id"),
    )


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
