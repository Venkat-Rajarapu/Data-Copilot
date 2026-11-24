from typing import Any, Literal

from pydantic import BaseModel, Field, model_validator


# ==========================================
# PHASE 6.1 - MISSING VALUE REQUEST
# ==========================================

class MissingValueCleaningRequest(BaseModel):

    operation: Literal[
        "drop_rows",
        "drop_columns",
        "fill_mean",
        "fill_median",
        "fill_mode",
        "fill_constant",
        "forward_fill",
        "backward_fill",
    ]

    columns: list[str] = Field(
        min_length=1,
    )

    value: Any = None

    preview_limit: int = Field(
        default=20,
        ge=1,
        le=100,
    )

    @model_validator(mode="after")
    def validate_constant_value(self):

        if self.operation == "fill_constant":

            if self.value is None:
                raise ValueError(
                    "A value is required for fill_constant."
                )

            if isinstance(self.value, (dict, list)):
                raise ValueError(
                    "Constant value must be a scalar."
                )

        return self


# ==========================================
# PHASE 6.2 - DUPLICATE CLEANING REQUEST
# ==========================================

class DuplicateCleaningRequest(BaseModel):

    columns: list[str] | None = None

    keep: Literal[
        "first",
        "last",
        "none",
    ] = "first"

    preview_limit: int = Field(
        default=20,
        ge=1,
        le=100,
    )

    @model_validator(mode="after")
    def validate_columns(self):

        if self.columns is not None:

            if len(self.columns) == 0:
                raise ValueError(
                    "Select at least one column or use null for full-row duplicates."
                )

            if len(self.columns) != len(set(self.columns)):
                raise ValueError(
                    "Duplicate column selections are not allowed."
                )

        return self