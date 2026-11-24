from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
)


# ==========================================
# USER BASE SCHEMA
# ==========================================

class UserBase(BaseModel):

    full_name: str = Field(
        ...,
        min_length=2,
        max_length=150,
    )

    email: EmailStr


# ==========================================
# USER CREATE SCHEMA
# ==========================================

class UserCreate(UserBase):

    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
    )


# ==========================================
# USER UPDATE SCHEMA
# ==========================================

class UserUpdate(BaseModel):

    full_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    email: EmailStr | None = None

    password: str | None = Field(
        default=None,
        min_length=8,
        max_length=128,
    )

    role_id: int | None = Field(
        default=None,
        gt=0,
    )

    is_active: bool | None = None


# ==========================================
# USER RESPONSE SCHEMA
# ==========================================

class UserResponse(UserBase):

    id: int

    role_id: int

    is_active: bool

    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )