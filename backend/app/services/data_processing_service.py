import json
import pandas as pd

from fastapi import HTTPException, status

from app.services.dataset_service import (
    read_dataset,
    validate_stored_file_path,
)

from app.data_pipeline.processing.type_converter import (
    convert_column_type,
)

from app.data_pipeline.processing.outlier_treatment import (
    treat_outliers,
)

from app.data_pipeline.processing.data_transformer import (
    normalize_column,
    standardize_column,
    label_encode_column,
    one_hot_encode_column,
    rename_column,
)


# ==========================================
# DATAFRAME PREVIEW
# ==========================================

def dataframe_to_records(
    dataframe: pd.DataFrame,
    limit: int = 20,
):

    preview = dataframe.head(limit)

    return json.loads(
        preview.to_json(
            orient="records",
            date_format="iso",
        )
    )


# ==========================================
# LOAD DATASET
# ==========================================

def load_dataset_for_processing(
    file_path: str,
    file_type: str,
):

    safe_path = validate_stored_file_path(
        file_path
    )

    extension = (
        f".{file_type.lower().lstrip('.')}"
    )

    dataframe = read_dataset(
        file_path=safe_path,
        extension=extension,
    )

    dataframe = dataframe.copy()

    dataframe = dataframe.replace(
        r"^\s*$",
        pd.NA,
        regex=True,
    )

    return dataframe


# ==========================================
# PHASE 6.3 - TYPE CONVERSION PREVIEW
# ==========================================

def preview_data_type_conversion(
    file_path: str,
    file_type: str,
    columns: list[str],
    target_type: str,
    preview_limit: int = 20,
):

    dataframe = load_dataset_for_processing(
        file_path=file_path,
        file_type=file_type,
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
                "message": "Selected columns do not exist.",
                "invalid_columns": invalid_columns,
            },
        )

    before_preview = dataframe_to_records(
        dataframe,
        preview_limit,
    )

    processed_dataframe = dataframe.copy(
        deep=True
    )

    conversion_summary = []

    for column in columns:

        try:

            result = convert_column_type(
                dataframe=processed_dataframe,
                column=column,
                target_type=target_type,
            )

            conversion_summary.append(
                result
            )

        except Exception as error:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Conversion failed for column "
                    f"'{column}': {str(error)}"
                ),
            )

    after_preview = dataframe_to_records(
        processed_dataframe,
        preview_limit,
    )

    return {
        "total_rows": len(dataframe),
        "total_columns": len(dataframe.columns),
        "selected_columns": columns,
        "target_type": target_type,
        "before_preview": before_preview,
        "after_preview": after_preview,
        "conversion_summary": conversion_summary,
        "original_dataset_modified": False,
    }


# ==========================================
# PHASE 6.4 - OUTLIER TREATMENT PREVIEW
# ==========================================

def preview_outlier_treatment(
    file_path: str,
    file_type: str,
    columns: list[str],
    method: str = "iqr",
    treatment: str = "cap",
    preview_limit: int = 20,
):

    dataframe = load_dataset_for_processing(
        file_path=file_path,
        file_type=file_type,
    )

    before_preview = dataframe_to_records(
        dataframe,
        preview_limit,
    )

    try:

        processed_dataframe, treatment_summary = treat_outliers(
            dataframe=dataframe,
            columns=columns,
            method=method,
            treatment=treatment,
        )

    except ValueError as error:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )

    except Exception as error:

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Outlier treatment failed: {str(error)}",
        )

    after_preview = dataframe_to_records(
        processed_dataframe,
        preview_limit,
    )

    return {
        "total_rows": len(dataframe),
        "processed_rows": len(processed_dataframe),
        "total_columns": len(dataframe.columns),
        "selected_columns": columns,
        "method": method,
        "treatment": treatment,
        "before_preview": before_preview,
        "after_preview": after_preview,
        "treatment_summary": treatment_summary,
        "original_dataset_modified": False,
    }


# ==========================================
# PHASE 6.5 - DATA TRANSFORMATION PREVIEW
# ==========================================

def preview_data_transformation(
    file_path: str,
    file_type: str,
    columns: list[str],
    operation: str,
    new_name: str = None,
    preview_limit: int = 20,
):

    # ======================================
    # LOAD ORIGINAL DATASET
    # ======================================

    dataframe = load_dataset_for_processing(
        file_path=file_path,
        file_type=file_type,
    )

    # ======================================
    # VALIDATE SELECTED COLUMNS
    # ======================================

    if not columns:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one column must be selected.",
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
                "message": "Selected columns do not exist.",
                "invalid_columns": invalid_columns,
            },
        )

    # ======================================
    # VALIDATE OPERATION
    # ======================================

    supported_operations = {
        "normalize",
        "standardize",
        "label_encode",
        "one_hot_encode",
        "rename",
    }

    if operation not in supported_operations:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported transformation operation.",
        )

    if operation == "rename":

        if len(columns) != 1:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Column renaming supports exactly one column.",
            )

        if not new_name or not new_name.strip():

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A valid new column name is required.",
            )

    # ======================================
    # BEFORE PREVIEW
    # ======================================

    before_preview = dataframe_to_records(
        dataframe,
        preview_limit,
    )

    # ======================================
    # CREATE WORKING COPY
    # ======================================

    processed_dataframe = dataframe.copy(
        deep=True
    )

    transformation_summary = []

    # ======================================
    # APPLY TRANSFORMATION
    # ======================================

    try:

        for column in columns:

            # ------------------------------
            # NORMALIZATION
            # ------------------------------

            if operation == "normalize":

                result = normalize_column(
                    processed_dataframe,
                    column,
                )

            # ------------------------------
            # STANDARDIZATION
            # ------------------------------

            elif operation == "standardize":

                result = standardize_column(
                    processed_dataframe,
                    column,
                )

            # ------------------------------
            # LABEL ENCODING
            # ------------------------------

            elif operation == "label_encode":

                result = label_encode_column(
                    processed_dataframe,
                    column,
                )

            # ------------------------------
            # ONE-HOT ENCODING
            # ------------------------------

            elif operation == "one_hot_encode":

                processed_dataframe, result = one_hot_encode_column(
                    processed_dataframe,
                    column,
                )

            # ------------------------------
            # COLUMN RENAMING
            # ------------------------------

            elif operation == "rename":

                result = rename_column(
                    processed_dataframe,
                    column,
                    new_name,
                )

            transformation_summary.append(
                result
            )

    except ValueError as error:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )

    except Exception as error:

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Data transformation failed: {str(error)}",
        )

    # ======================================
    # AFTER PREVIEW
    # ======================================

    after_preview = dataframe_to_records(
        processed_dataframe,
        preview_limit,
    )

    # ======================================
    # FINAL RESPONSE
    # ======================================

    return {

        "total_rows": len(dataframe),

        "processed_rows": len(processed_dataframe),

        "original_columns": len(dataframe.columns),

        "processed_columns": len(processed_dataframe.columns),

        "selected_columns": columns,

        "operation": operation,

        "before_preview": before_preview,

        "after_preview": after_preview,

        "transformation_summary": transformation_summary,

        "original_dataset_modified": False,
    }