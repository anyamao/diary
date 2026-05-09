from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime, date
from uuid import UUID
from typing import Optional, List
from app.models import UserRole


class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: Optional[str] = Field(None, max_length=100)


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)


class PlannerTaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    start_time: Optional[str] = Field(
        None, pattern=r"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
    )
    end_time: Optional[str] = Field(None, pattern=r"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")
    color: str = Field(default="yellow")
    is_completed: bool = False
    position: int = 0


class DiaryEntryBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: Optional[str] = None
    mood: Optional[str] = Field(None, max_length=50)
    tags: Optional[str] = Field(None, max_length=500)
    is_favorite: bool = False
    created_at: Optional[datetime] = None


class PlannerTaskCreate(PlannerTaskBase):
    planner_day_id: UUID


class PlannerTaskUpdate(PlannerTaskBase):
    title: Optional[str] = None


class PlannerTaskResponse(PlannerTaskBase):
    id: UUID
    planner_day_id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class PlannerDayBase(BaseModel):
    date: date
    is_important: bool = False
    notes: Optional[str] = None


class PlannerDayCreate(PlannerDayBase):
    pass


class PlannerDayUpdate(PlannerDayBase):
    date: Optional[date] = None


class PlannerDayResponse(PlannerDayBase):
    id: UUID
    user_id: UUID
    tasks: List[PlannerTaskResponse] = []
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class UserResponse(UserBase):
    id: UUID
    role: UserRole
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime]
    avatar: Optional[str] = "icon1.jpg"
    model_config = ConfigDict(from_attributes=True)


class BusinessNoteBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: Optional[str] = None
    tags: Optional[str] = Field(None, max_length=500)
    is_pinned: bool = False


class StudyTimerSessionBase(BaseModel):
    tag: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None


class StudyTimerSessionCreate(StudyTimerSessionBase):
    pass


class StudyTimerSessionStart(StudyTimerSessionBase):
    start_time: datetime


class StudyTimerSessionStop(BaseModel):
    end_time: datetime


class StudyTimerSessionResponse(StudyTimerSessionBase):
    id: UUID
    user_id: UUID
    start_time: datetime
    end_time: Optional[datetime]
    duration_seconds: Optional[int]
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TimerTagCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    color: str = "blue"


class TimerTagResponse(BaseModel):
    id: UUID
    name: str
    color: str

    model_config = ConfigDict(from_attributes=True)


class BusinessNoteCreate(BusinessNoteBase):
    pass


class BusinessNoteUpdate(BusinessNoteBase):
    title: Optional[str] = None


class BusinessNoteResponse(BusinessNoteBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str
    exp: datetime
    type: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class MessageResponse(BaseModel):
    message: str
    success: bool


class DiaryEntryUpdate(DiaryEntryBase):
    title: Optional[str] = None
    created_at: Optional[datetime] = None


class DiaryEntryCreate(DiaryEntryBase):
    created_at: Optional[datetime] = None


class DiaryEntryResponse(DiaryEntryBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class ShoppingItemBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    quantity: int = Field(default=1, ge=1)
    unit: Optional[str] = Field(None, max_length=50)
    category: Optional[str] = Field(None, max_length=100)


class ShoppingItemCreate(ShoppingItemBase):
    pass


class ShoppingItemUpdate(ShoppingItemBase):
    is_completed: Optional[bool] = None


class SleepRecordBase(BaseModel):
    date: datetime
    sleep_start: datetime
    sleep_end: datetime
    duration_hours: float = Field(..., ge=0, le=24)

    model_config = ConfigDict(from_attributes=True)


class SleepRecordCreate(SleepRecordBase):
    pass


class SleepNoteBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: Optional[str] = None
    dream_type: Optional[str] = Field(None, max_length=50)
    wake_mood: Optional[str] = Field(None, max_length=50)
    tags: List[str] = Field(default_factory=list)


class SleepNoteCreate(SleepNoteBase):
    sleep_record_id: UUID


class SleepNoteUpdate(SleepNoteBase):
    title: Optional[str] = None


class SleepNoteResponse(SleepNoteBase):
    id: UUID
    sleep_record_id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class SleepRecordUpdate(BaseModel):
    sleep_start: Optional[datetime] = None
    sleep_end: Optional[datetime] = None
    duration_hours: Optional[float] = None


class SleepRecordResponse(SleepRecordBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: Optional[datetime]


class ShoppingItemResponse(ShoppingItemBase):
    id: UUID
    user_id: UUID
    is_completed: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
