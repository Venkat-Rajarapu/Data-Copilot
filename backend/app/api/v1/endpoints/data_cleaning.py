from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy.orm import Session

from app.db.dependencies import get_db

from app.core.permissions import require_analyst

from app.schemas.data_cleaning import (
    MissingValueCleaningRequest,
    DuplicateCleaningRequest,
)

from app.services.data_cleaning_service import (
    preview_missing_value_cleaning,
    preview_duplicate_cleaning,
    load_dataset_for_cleaning,
    apply_missing_value_operation,
    apply_duplicate_removal,
)

from app.services.version_service import (
    save_dataset_version,
)

from database.repositories import dataset_repository


# ==========================================
# ROUTER
# ==========================================

router = APIRouter(
    prefix="/data-cleaning",
    tags=["Data Cleaning"],
)


# ==========================================
# VERIFY DATASET ACCESS
# ==========================================

def verify_dataset_access(
    dataset,
    current_user,
):

    if current_user.role_id == 1:
        return

    if dataset.owner_id != current_user.id:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to clean this dataset.",
        )


# ==========================================
# COMMON DATASET RETRIEVAL
# ==========================================

def get_accessible_dataset(
    dataset_id: int,
    db: Session,
    current_user,
):

    dataset = dataset_repository.get_dataset_by_id(
        db=db,
        dataset_id=dataset_id,
    )

    if dataset is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found.",
        )

    verify_dataset_access(
        dataset,
        current_user,
    )

    return dataset


# ==========================================
# PHASE 6.1 - MISSING VALUE PREVIEW
# ==========================================

@router.post(
    "/datasets/{dataset_id}/missing-values/preview",
)
def preview_missing_value_cleaning_endpoint(
    dataset_id: int,
    request: MissingValueCleaningRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_analyst),
):

    dataset = get_accessible_dataset(
        dataset_id,
        db,
        current_user,
    )

    result = preview_missing_value_cleaning(
        file_path=dataset.file_path,
        file_type=dataset.file_type,
        operation=request.operation,
        columns=request.columns,
        value=request.value,
        preview_limit=request.preview_limit,
    )

    return {
        "success": True,
        "message": "Missing value cleaning preview generated successfully.",
        "dataset": {
            "id": dataset.id,
            "name": dataset.name,
            "filename": dataset.original_filename,
            "file_type": dataset.file_type,
        },
        **result,
    }


# ==========================================
# PHASE 6.1 - APPLY MISSING VALUE CLEANING
# ==========================================

@router.post(
    "/datasets/{dataset_id}/missing-values/apply",
)
def apply_missing_value_cleaning_endpoint(
    dataset_id: int,
    request: MissingValueCleaningRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_analyst),
):

    dataset = get_accessible_dataset(
        dataset_id,
        db,
        current_user,
    )

    try:

        original_dataframe = load_dataset_for_cleaning(
            file_path=dataset.file_path,
            file_type=dataset.file_type,
        )

        cleaned_dataframe, changes = apply_missing_value_operation(
            dataframe=original_dataframe,
            operation=request.operation,
            columns=request.columns,
            value=request.value,
        )

        version = save_dataset_version(
            db=db,
            dataset=dataset,
            dataframe=cleaned_dataframe,
            user_id=current_user.id,
            operation_type="missing_value_cleaning",
            operation_config={
                "operation": request.operation,
                "columns": request.columns,
                "value": request.value,
            },
        )

        return {
            "success": True,
            "message": "Missing value cleaning applied successfully.",
            "dataset_id": dataset.id,
            "version": {
                "id": version.id,
                "version_number": version.version_number,
                "operation_type": version.operation_type,
                "row_count": version.row_count,
                "column_count": version.column_count,
                "file_size": version.file_size,
            },
            "changes": changes,
        }

    except HTTPException:
        raise

    except ValueError as error:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )

    except Exception as error:

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unable to apply missing value cleaning: {str(error)}",
        )


# ==========================================
# PHASE 6.2 - DUPLICATE CLEANING PREVIEW
# ==========================================

@router.post(
    "/datasets/{dataset_id}/duplicates/preview",
)
def preview_duplicate_cleaning_endpoint(
    dataset_id: int,
    request: DuplicateCleaningRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_analyst),
):

    dataset = get_accessible_dataset(
        dataset_id,
        db,
        current_user,
    )

    result = preview_duplicate_cleaning(
        file_path=dataset.file_path,
        file_type=dataset.file_type,
        columns=request.columns,
        keep=request.keep,
        preview_limit=request.preview_limit,
    )

    return {
        "success": True,
        "message": "Duplicate cleaning preview generated successfully.",
        "dataset": {
            "id": dataset.id,
            "name": dataset.name,
            "filename": dataset.original_filename,
            "file_type": dataset.file_type,
        },
        **result,
    }


# ==========================================
# PHASE 6.2 - APPLY DUPLICATE CLEANING
# ==========================================

@router.post(
    "/datasets/{dataset_id}/duplicates/apply",
)
def apply_duplicate_cleaning_endpoint(
    dataset_id: int,
    request: DuplicateCleaningRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_analyst),
):

    dataset = get_accessible_dataset(
        dataset_id,
        db,
        current_user,
    )

    try:

        original_dataframe = load_dataset_for_cleaning(
            file_path=dataset.file_path,
            file_type=dataset.file_type,
        )

        cleaned_dataframe, analysis = apply_duplicate_removal(
            dataframe=original_dataframe,
            columns=request.columns,
            keep=request.keep,
        )

        version = save_dataset_version(
            db=db,
            dataset=dataset,
            dataframe=cleaned_dataframe,
            user_id=current_user.id,
            operation_type="duplicate_removal",
            operation_config={
                "columns": request.columns,
                "keep": request.keep,
            },
        )

        return {
            "success": True,
            "message": "Duplicate removal applied successfully.",
            "dataset_id": dataset.id,
            "version": {
                "id": version.id,
                "version_number": version.version_number,
                "operation_type": version.operation_type,
                "row_count": version.row_count,
                "column_count": version.column_count,
                "file_size": version.file_size,
            },
            **analysis,
        }

    except HTTPException:
        raise

    except ValueError as error:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )

    except Exception as error:

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unable to apply duplicate cleaning: {str(error)}",
        )