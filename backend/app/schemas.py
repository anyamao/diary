from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import Optional
from app.models import UserRole


class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: Optional[str] = Field(None, max_length=100)


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)


class UserResponse(UserBase):
    id: UUID
    role: UserRole
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime]

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

# Diary Entry Schemas
class DiaryEntryBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: Optional[str] = None
    mood: Optional[str] = Field(None, max_length=50)
    tags: Optional[str] = Field(None, max_length=500)
    is_favorite: bool = False

class DiaryEntryCreate(DiaryEntryBase):
    pass

class DiaryEntryUpdate(DiaryEntryBase):
    title: Optional[str] = None

class DiaryEntryResponse(DiaryEntryBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: Optional[datetime]
    
    model_config = ConfigDict(from_attributes=True)

# Shopping Item Schemas
class ShoppingItemBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    quantity: int = Field(default=1, ge=1)
    unit: Optional[str] = Field(None, max_length=50)
    category: Optional[str] = Field(None, max_length=100)

class ShoppingItemCreate(ShoppingItemBase):
    pass

class ShoppingItemUpdate(ShoppingItemBase):
    is_completed: Optional[bool] = None

class ShoppingItemResponse(ShoppingItemBase):
    id: UUID
    user_id: UUID
    is_completed: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Diary Entry Schemas
class DiaryEntryBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: Optional[str] = None
    mood: Optional[str] = Field(None, max_length=50)
    tags: Optional[str] = Field(None, max_length=500)
    is_favorite: bool = False

class DiaryEntryCreate(DiaryEntryBase):
    pass

class DiaryEntryUpdate(DiaryEntryBase):
    title: Optional[str] = None

class DiaryEntryResponse(DiaryEntryBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: Optional[datetime]
    
    model_config = ConfigDict(from_attributes=True)

# Shopping Item Schemas
class ShoppingItemBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    quantity: int = Field(default=1, ge=1)
    unit: Optional[str] = Field(None, max_length=50)
    category: Optional[str] = Field(None, max_length=100)

class ShoppingItemCreate(ShoppingItemBase):
    pass

class ShoppingItemUpdate(ShoppingItemBase):
    is_completed: Optional[bool] = None

class ShoppingItemResponse(ShoppingItemBase):
    id: UUID
    user_id: UUID
    is_completed: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
