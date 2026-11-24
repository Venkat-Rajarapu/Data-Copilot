from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# ==========================================
# DATASET BASE
# ==========================================

class DatasetBase(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=150,
    )


# ==========================================
# DATASET CREATE
# ==========================================

class DatasetCreate(DatasetBase):
    """
    Dataset creation request.

    File metadata and owner information
    will be assigned by the backend.
    """
    pass


# ==========================================
# DATASET UPDATE
# ==========================================

class DatasetUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    row_count: int | None = Field(
        default=None,
        ge=0,
    )

    column_count: int | None = Field(
        default=None,
        ge=0,
    )

    status: str | None = Field(
        default=None,
        max_length=30,
    )


# ==========================================
# DATASET RESPONSE
# ==========================================

class DatasetResponse(BaseModel):
    id: int

    name: str

    original_filename: str

    file_type: str

    file_size: int

    row_count: int

    column_count: int

    status: str

    owner_id: int

    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )