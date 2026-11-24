import json

import pandas as pd

from fastapi import HTTPException, status

from app.services.dataset_service import (
    read_dataset,
    validate_stored_file_path,
)


# ============================================================
# COMMON UTILITIES
# ============================================================

def normalize_missing_values(
    dataframe: pd.DataFrame,
) -> pd.DataFrame:

    dataframe = dataframe.copy()

    dataframe = dataframe.replace(
        r"^\s*$",
        pd.NA,
        regex=True,
    )

    return dataframe


def validate_columns(
    dataframe: pd.DataFrame,
    columns: list[str],
):

    if not columns:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Select at least one column.",
        )

    if len(columns) != len(set(columns)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duplicate column selections are not allowed.",
        )

    invalid_columns = [
        column
        for column in columns
        if column not in dataframe.columns
    ]

    if invalid_columns:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "Invalid column selection.",
                "invalid_columns": invalid_columns,
            },
        )


def dataframe_to_records(
    dataframe: pd.DataFrame,
    limit: int = 20,
) -> list:

    preview = dataframe.head(limit)

    return json.loads(
        preview.to_json(
            orient="records",
            date_format="iso",
        )
    )


def load_dataset_for_cleaning(
    file_path: str,
    file_type: str,
) -> pd.DataFrame:

    safe_path = validate_stored_file_path(file_path)

    extension = f".{file_type.lower().lstrip('.')}"

    dataframe = read_dataset(
        file_path=safe_path,
        extension=extension,
    )

    dataframe = normalize_missing_values(dataframe)

    # Convert numeric-looking text columns into numeric columns.
    for column in dataframe.columns:

        # Preserve identifier columns as strings.
        if "id" in str(column).lower():
            continue

        if dataframe[column].dtype == "object" or \
                pd.api.types.is_string_dtype(dataframe[column]):

            original = dataframe[column].astype("string").str.strip()

            # Handle currency symbols and thousands separators.
            cleaned = (
                original
                .str.replace(r"[₹,]", "", regex=True)
                .str.replace(
                    r"(?i)^\s*(?:INR|Rs\.?)\s*",
                    "",
                    regex=True,
                )
                .str.replace(
                    r"(?i)\s*(?:INR|Rs\.?)\s*$",
                    "",
                    regex=True,
                )
            )

            converted = pd.to_numeric(
                cleaned,
                errors="coerce",
            )

            valid_original = original.notna()
            valid_converted = converted.notna()

            # Convert only when every non-empty value is numeric.
            if (
                valid_original.sum() > 0
                and (valid_original == valid_converted).all()
            ):
                dataframe[column] = converted

    return dataframe

# ============================================================
# PHASE 6.1 - MISSING VALUE STATISTICS
# ============================================================

def get_missing_statistics(
    dataframe: pd.DataFrame,
) -> dict:

    missing_by_column = (
        dataframe.isna()
        .sum()
        .astype(int)
        .to_dict()
    )

    total_missing = int(
        dataframe.isna().sum().sum()
    )

    total_cells = (
        len(dataframe) * len(dataframe.columns)
    )

    missing_percentage = (
        round(
            (total_missing / total_cells) * 100,
            2,
        )
        if total_cells > 0
        else 0
    )

    return {
        "total_rows": len(dataframe),
        "total_columns": len(dataframe.columns),
        "total_missing_values": total_missing,
        "missing_percentage": missing_percentage,
        "affected_columns": {
            str(column): count
            for column, count in missing_by_column.items()
            if count > 0
        },
    }


# ============================================================
# PHASE 6.1 - APPLY MISSING VALUE OPERATION
# ============================================================

def apply_missing_value_operation(
    dataframe: pd.DataFrame,
    operation: str,
    columns: list[str],
    value=None,
) -> tuple[pd.DataFrame, dict]:

    dataframe = dataframe.copy()

    validate_columns(
        dataframe,
        columns,
    )

    before_missing = int(
        dataframe.isna().sum().sum()
    )

    removed_rows = 0
    removed_columns = []
    filled_values = 0
    unfillable_columns = []

    # --------------------------------------------------------
    # DROP ROWS
    # --------------------------------------------------------

    if operation == "drop_rows":

        before_rows = len(dataframe)

        dataframe = dataframe.dropna(
            subset=columns,
        )

        removed_rows = before_rows - len(dataframe)

    # --------------------------------------------------------
    # DROP COLUMNS
    # --------------------------------------------------------

    elif operation == "drop_columns":

        for column in columns:

            if dataframe[column].isna().any():

                dataframe = dataframe.drop(
                    columns=[column],
                )

                removed_columns.append(column)

    # --------------------------------------------------------
    # FILL MEAN
    # --------------------------------------------------------

    elif operation == "fill_mean":

        for column in columns:

            if not pd.api.types.is_numeric_dtype(
                dataframe[column]
            ):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Column '{column}' is not numeric. "
                        "Mean requires numeric columns."
                    ),
                )

            mean_value = dataframe[column].mean()

            if pd.notna(mean_value):

                missing_count = int(
                    dataframe[column].isna().sum()
                )

                dataframe[column] = (
                    dataframe[column].fillna(mean_value)
                )

                filled_values += missing_count

            elif dataframe[column].isna().any():

                unfillable_columns.append(column)

    # --------------------------------------------------------
    # FILL MEDIAN
    # --------------------------------------------------------

    elif operation == "fill_median":

        for column in columns:

            if not pd.api.types.is_numeric_dtype(
                dataframe[column]
            ):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Column '{column}' is not numeric. "
                        "Median requires numeric columns."
                    ),
                )

            median_value = dataframe[column].median()

            if pd.notna(median_value):

                missing_count = int(
                    dataframe[column].isna().sum()
                )

                dataframe[column] = (
                    dataframe[column].fillna(median_value)
                )

                filled_values += missing_count

            elif dataframe[column].isna().any():

                unfillable_columns.append(column)

    # --------------------------------------------------------
    # FILL MODE
    # --------------------------------------------------------

    elif operation == "fill_mode":

        for column in columns:

            modes = dataframe[column].mode(
                dropna=True,
            )

            if not modes.empty:

                missing_count = int(
                    dataframe[column].isna().sum()
                )

                dataframe[column] = (
                    dataframe[column].fillna(modes.iloc[0])
                )

                filled_values += missing_count

            elif dataframe[column].isna().any():

                unfillable_columns.append(column)

    # --------------------------------------------------------
    # FILL CONSTANT
    # --------------------------------------------------------

    elif operation == "fill_constant":

        for column in columns:

            missing_count = int(
                dataframe[column].isna().sum()
            )

            dataframe[column] = (
                dataframe[column].fillna(value)
            )

            filled_values += missing_count

    # --------------------------------------------------------
    # FORWARD FILL
    # --------------------------------------------------------

    elif operation == "forward_fill":

        missing_before = int(
            dataframe[columns].isna().sum().sum()
        )

        dataframe[columns] = (
            dataframe[columns].ffill()
        )

        missing_after = int(
            dataframe[columns].isna().sum().sum()
        )

        filled_values = missing_before - missing_after

    # --------------------------------------------------------
    # BACKWARD FILL
    # --------------------------------------------------------

    elif operation == "backward_fill":

        missing_before = int(
            dataframe[columns].isna().sum().sum()
        )

        dataframe[columns] = (
            dataframe[columns].bfill()
        )

        missing_after = int(
            dataframe[columns].isna().sum().sum()
        )

        filled_values = missing_before - missing_after

    else:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported cleaning operation.",
        )

    after_missing = int(
        dataframe.isna().sum().sum()
    )

    changes = {
        "filled_values": filled_values,
        "removed_rows": removed_rows,
        "removed_columns": removed_columns,
        "removed_column_count": len(removed_columns),
        "remaining_missing_values": after_missing,
        "missing_values_before": before_missing,
        "missing_values_after": after_missing,
        "unfillable_columns": unfillable_columns,
    }

    return dataframe, changes


# ============================================================
# PHASE 6.1 - PREVIEW MISSING VALUE CLEANING
# ============================================================

def preview_missing_value_cleaning(
    file_path: str,
    file_type: str,
    operation: str,
    columns: list[str],
    value=None,
    preview_limit: int = 20,
) -> dict:

    original_dataframe = load_dataset_for_cleaning(
        file_path=file_path,
        file_type=file_type,
    )

    before_statistics = get_missing_statistics(
        original_dataframe
    )

    cleaned_dataframe, changes = (
        apply_missing_value_operation(
            dataframe=original_dataframe.copy(),
            operation=operation,
            columns=columns,
            value=value,
        )
    )

    after_statistics = get_missing_statistics(
        cleaned_dataframe
    )

    return {
        "operation": operation,
        "selected_columns": columns,
        "before": before_statistics,
        "after": after_statistics,
        "changes": changes,
        "preview": {
            "original_records": dataframe_to_records(
                original_dataframe,
                preview_limit,
            ),
            "cleaned_records": dataframe_to_records(
                cleaned_dataframe,
                preview_limit,
            ),
            "original_columns": [
                str(column)
                for column in original_dataframe.columns
            ],
            "cleaned_columns": [
                str(column)
                for column in cleaned_dataframe.columns
            ],
        },
    }


# ============================================================
# PHASE 6.2 - DUPLICATE STATISTICS
# ============================================================

def get_duplicate_statistics(
    dataframe: pd.DataFrame,
    columns: list[str] | None = None,
) -> dict:

    if columns is not None:

        validate_columns(
            dataframe,
            columns,
        )

    duplicate_mask = dataframe.duplicated(
        subset=columns,
        keep=False,
    )

    duplicate_excess_mask = dataframe.duplicated(
        subset=columns,
        keep="first",
    )

    total_rows = len(dataframe)

    duplicate_rows = int(
        duplicate_excess_mask.sum()
    )

    rows_in_duplicate_groups = int(
        duplicate_mask.sum()
    )

    unique_rows = total_rows - duplicate_rows

    duplicate_percentage = (
        round(
            (duplicate_rows / total_rows) * 100,
            2,
        )
        if total_rows > 0
        else 0
    )

    return {
        "total_rows": total_rows,
        "duplicate_rows": duplicate_rows,
        "rows_in_duplicate_groups": rows_in_duplicate_groups,
        "unique_rows": unique_rows,
        "duplicate_percentage": duplicate_percentage,
        "duplicate_status": (
            "duplicates_found"
            if duplicate_rows > 0
            else "no_duplicates"
        ),
    }


# ============================================================
# PHASE 6.2 - APPLY DUPLICATE REMOVAL
# ============================================================

def apply_duplicate_removal(
    dataframe: pd.DataFrame,
    columns: list[str] | None = None,
    keep: str = "first",
) -> tuple[pd.DataFrame, dict]:

    dataframe = dataframe.copy()

    if keep not in {"first", "last", "none"}:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid duplicate keep strategy.",
        )

    if columns is not None:

        validate_columns(
            dataframe,
            columns,
        )

    before_statistics = get_duplicate_statistics(
        dataframe,
        columns,
    )

    before_rows = len(dataframe)

    if keep == "none":

        duplicate_mask = dataframe.duplicated(
            subset=columns,
            keep=False,
        )

        cleaned_dataframe = dataframe.loc[
            ~duplicate_mask
        ].copy()

    else:

        cleaned_dataframe = dataframe.drop_duplicates(
            subset=columns,
            keep=keep,
        ).copy()

    after_statistics = get_duplicate_statistics(
        cleaned_dataframe,
        columns,
    )

    removed_rows = before_rows - len(cleaned_dataframe)

    changes = {
        "removed_rows": removed_rows,
        "remaining_rows": len(cleaned_dataframe),
        "keep_strategy": keep,
    }

    return cleaned_dataframe, {
        "before": before_statistics,
        "after": after_statistics,
        "changes": changes,
    }


# ============================================================
# PHASE 6.2 - PREVIEW DUPLICATE CLEANING
# ============================================================

def preview_duplicate_cleaning(
    file_path: str,
    file_type: str,
    columns: list[str] | None = None,
    keep: str = "first",
    preview_limit: int = 20,
) -> dict:

    original_dataframe = load_dataset_for_cleaning(
        file_path=file_path,
        file_type=file_type,
    )

    cleaned_dataframe, analysis = (
        apply_duplicate_removal(
            dataframe=original_dataframe.copy(),
            columns=columns,
            keep=keep,
        )
    )

    return {
        "operation": "duplicate_removal",
        "selected_columns": columns,
        "before": analysis["before"],
        "after": analysis["after"],
        "changes": analysis["changes"],
        "preview": {
            "original_records": dataframe_to_records(
                original_dataframe,
                preview_limit,
            ),
            "cleaned_records": dataframe_to_records(
                cleaned_dataframe,
                preview_limit,
            ),
            "original_columns": [
                str(column)
                for column in original_dataframe.columns
            ],
            "cleaned_columns": [
                str(column)
                for column in cleaned_dataframe.columns
            ],
        },
    }