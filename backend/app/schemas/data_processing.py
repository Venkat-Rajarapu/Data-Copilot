from typing import Literal

from pydantic import BaseModel, Field, model_validator


# ==========================================
# PHASE 6.3 - DATA TYPE CONVERSION REQUEST
# ==========================================

class DataTypeConversionRequest(BaseModel):

    columns: list[str] = Field(
        min_length=1,
    )

    target_type: Literal[
        "integer",
        "float",
        "string",
        "datetime",
        "boolean",
    ]

    preview_limit: int = Field(
        default=20,
        ge=1,
        le=100,
    )

    @model_validator(mode="after")
    def validate_columns(self):

        if len(self.columns) != len(set(self.columns)):
            raise ValueError(
                "Duplicate column selections are not allowed."
            )

        if any(not column.strip() for column in self.columns):
            raise ValueError(
                "Column names cannot be empty."
            )

        return self


# ==========================================
# PHASE 6.4 - OUTLIER TREATMENT REQUEST
# ==========================================

class OutlierTreatmentRequest(BaseModel):

    columns: list[str] = Field(
        min_length=1,
    )

    method: Literal[
        "iqr",
        "zscore",
    ] = "iqr"

    treatment: Literal[
        "remove",
        "cap",
        "median",
    ] = "cap"

    preview_limit: int = Field(
        default=20,
        ge=1,
        le=100,
    )

    @model_validator(mode="after")
    def validate_columns(self):

        if len(self.columns) != len(set(self.columns)):
            raise ValueError(
                "Duplicate column selections are not allowed."
            )

        if any(not column.strip() for column in self.columns):
            raise ValueError(
                "Column names cannot be empty."
            )

        return self


# ==========================================
# PHASE 6.5 - DATA TRANSFORMATION REQUEST
# ==========================================

class DataTransformationRequest(BaseModel):

    operation: Literal[
        "normalize",
        "standardize",
        "label_encode",
        "one_hot_encode",
        "rename",
    ]

    columns: list[str] = Field(
        min_length=1,
    )

    new_name: str | None = None

    preview_limit: int = Field(
        default=20,
        ge=1,
        le=100,
    )

    @model_validator(mode="after")
    def validate_transformation(self):

        # Prevent duplicate column selections

        if len(self.columns) != len(set(self.columns)):
            raise ValueError(
                "Duplicate column selections are not allowed."
            )

        # Prevent empty column names

        if any(not column.strip() for column in self.columns):
            raise ValueError(
                "Column names cannot be empty."
            )

        # Rename validation

        if self.operation == "rename":

            if len(self.columns) != 1:
                raise ValueError(
                    "Column renaming supports exactly one column."
                )

            if not self.new_name or not self.new_name.strip():
                raise ValueError(
                    "A valid new column name is required."
                )

        elif self.new_name is not None:

            raise ValueError(
                "new_name is only allowed for rename operations."
            )

        return self