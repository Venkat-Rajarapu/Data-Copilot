from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy.orm import Session

from app.db.dependencies import get_db

from app.core.permissions import require_viewer

from app.services.dataset_service import (
    read_dataset,
    validate_stored_file_path,
)

from app.services.data_quality_service import (
    profile_dataset,
    profile_missing_values,
    detect_duplicates,
    validate_data_types,
    detect_outliers,
    calculate_quality_score,
    generate_quality_dashboard,
    generate_quality_report,
)

from database.repositories import dataset_repository


# ============================================================
# ROUTER CONFIGURATION
# ============================================================

router = APIRouter(
    prefix="/data-quality",
    tags=["Data Quality"],
)


# ============================================================
# VERIFY DATASET ACCESS
# ============================================================

def verify_dataset_access(dataset, current_user):

    # Admin can access all datasets.

    if current_user.role_id == 1:
        return

    # Other users can access only their own datasets.

    if dataset.owner_id != current_user.id:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to analyse this dataset.",
        )


# ============================================================
# SHARED DATASET LOADER
# ============================================================

def load_dataset_for_analysis(
    dataset_id: int,
    db: Session,
    current_user,
):

    # Find dataset.

    dataset = dataset_repository.get_dataset_by_id(
        db=db,
        dataset_id=dataset_id,
    )

    if dataset is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found.",
        )

    # Verify ownership and permissions.

    verify_dataset_access(
        dataset=dataset,
        current_user=current_user,
    )

    # Validate file path and read dataset.

    try:

        safe_path = validate_stored_file_path(
            dataset.file_path
        )

        extension = Path(safe_path).suffix.lower()

        dataframe = read_dataset(
            file_path=safe_path,
            extension=extension,
        )

        if dataframe.empty:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The dataset contains no records.",
            )

        return dataset, dataframe

    except HTTPException:
        raise

    except Exception as error:

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unable to load dataset: {str(error)}",
        ) from error


# ============================================================
# SHARED ANALYSIS EXECUTOR
# ============================================================

def execute_analysis(
    analysis_function,
    dataframe,
    error_message,
    **kwargs,
):

    try:

        return analysis_function(
            dataframe,
            **kwargs,
        )

    except HTTPException:
        raise

    except Exception as error:

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"{error_message}: {str(error)}",
        ) from error


# ============================================================
# DATASET METADATA
# ============================================================

def get_dataset_metadata(dataset):

    return {

        "id": dataset.id,

        "name": dataset.name,

        "filename": dataset.original_filename,

        "file_type": dataset.file_type,

    }


# ============================================================
# PHASE 5.1 - DATA PROFILING ENGINE
# ============================================================

@router.get(
    "/datasets/{dataset_id}/profile",
    summary="Dataset Profiling",
    description="Generate dataset statistics and column-level profiles.",
)
def get_dataset_profile(

    dataset_id: int,

    db: Session = Depends(get_db),

    current_user=Depends(require_viewer),

):

    dataset, dataframe = load_dataset_for_analysis(
        dataset_id,
        db,
        current_user,
    )

    result = execute_analysis(
        profile_dataset,
        dataframe,
        "Dataset profiling failed",
    )

    return {

        "success": True,

        "dataset": get_dataset_metadata(dataset),

        "profiling": result,

    }


# ============================================================
# PHASE 5.2 - MISSING VALUE DETECTION
# ============================================================

@router.get(
    "/datasets/{dataset_id}/missing-values",
    summary="Missing Value Detection",
    description="Detect missing values and recommend treatment methods.",
)
def get_missing_value_analysis(

    dataset_id: int,

    db: Session = Depends(get_db),

    current_user=Depends(require_viewer),

):

    dataset, dataframe = load_dataset_for_analysis(
        dataset_id,
        db,
        current_user,
    )

    result = execute_analysis(
        profile_missing_values,
        dataframe,
        "Missing value analysis failed",
    )

    return {

        "success": True,

        "dataset": get_dataset_metadata(dataset),

        "missing_value_analysis": result,

    }


# ============================================================
# PHASE 5.3 - DUPLICATE DETECTION
# ============================================================

@router.get(
    "/datasets/{dataset_id}/duplicates",
    summary="Duplicate Detection",
    description="Identify completely duplicated dataset rows.",
)
def get_duplicate_analysis(

    dataset_id: int,

    db: Session = Depends(get_db),

    current_user=Depends(require_viewer),

):

    dataset, dataframe = load_dataset_for_analysis(
        dataset_id,
        db,
        current_user,
    )

    result = execute_analysis(
        detect_duplicates,
        dataframe,
        "Duplicate detection failed",
    )

    return {

        "success": True,

        "dataset": get_dataset_metadata(dataset),

        "duplicate_analysis": result,

    }


# ============================================================
# PHASE 5.4 - DATA TYPE VALIDATION
# ============================================================

@router.get(
    "/datasets/{dataset_id}/validation",
    summary="Data Type Validation",
    description="Validate column values against inferred data types.",
)
def get_data_type_validation(

    dataset_id: int,

    db: Session = Depends(get_db),

    current_user=Depends(require_viewer),

):

    dataset, dataframe = load_dataset_for_analysis(
        dataset_id,
        db,
        current_user,
    )

    result = execute_analysis(
        validate_data_types,
        dataframe,
        "Data type validation failed",
    )

    return {

        "success": True,

        "dataset": get_dataset_metadata(dataset),

        "validation": result,

    }


# ============================================================
# PHASE 5.5 - OUTLIER DETECTION
# ============================================================

@router.get(
    "/datasets/{dataset_id}/outliers",
    summary="Outlier Detection",
    description="Detect numerical outliers using IQR or Z-score.",
)
def get_outlier_analysis(

    dataset_id: int,

    method: str = "iqr",

    db: Session = Depends(get_db),

    current_user=Depends(require_viewer),

):

    if method not in {"iqr", "zscore"}:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Method must be either 'iqr' or 'zscore'.",
        )

    dataset, dataframe = load_dataset_for_analysis(
        dataset_id,
        db,
        current_user,
    )

    result = execute_analysis(
        detect_outliers,
        dataframe,
        "Outlier detection failed",
        method=method,
    )

    return {

        "success": True,

        "dataset": get_dataset_metadata(dataset),

        "outlier_analysis": result,

    }


# ============================================================
# PHASE 5.6 - DATA QUALITY SCORING
# ============================================================

@router.get(
    "/datasets/{dataset_id}/quality-score",
    summary="Data Quality Score",
    description="Calculate overall dataset quality score.",
)
def get_quality_score(

    dataset_id: int,

    db: Session = Depends(get_db),

    current_user=Depends(require_viewer),

):

    dataset, dataframe = load_dataset_for_analysis(
        dataset_id,
        db,
        current_user,
    )

    result = execute_analysis(
        calculate_quality_score,
        dataframe,
        "Quality score calculation failed",
    )

    return {

        "success": True,

        "dataset": get_dataset_metadata(dataset),

        "quality_score": result,

    }


# ============================================================
# PHASE 5.7 - QUALITY DASHBOARD
# ============================================================

@router.get(
    "/datasets/{dataset_id}/quality-dashboard",
    summary="Quality Dashboard",
    description="Generate aggregated data quality dashboard metrics.",
)
def get_quality_dashboard(

    dataset_id: int,

    db: Session = Depends(get_db),

    current_user=Depends(require_viewer),

):

    dataset, dataframe = load_dataset_for_analysis(
        dataset_id,
        db,
        current_user,
    )

    result = execute_analysis(
        generate_quality_dashboard,
        dataframe,
        "Quality dashboard generation failed",
    )

    return {

        "success": True,

        "dataset": get_dataset_metadata(dataset),

        "dashboard": result,

    }


# ============================================================
# PHASE 5.8 - QUALITY REPORT
# ============================================================

@router.get(
    "/datasets/{dataset_id}/quality-report",
    summary="Quality Report",
    description="Generate a comprehensive data quality assessment report.",
)
def get_quality_report(

    dataset_id: int,

    db: Session = Depends(get_db),

    current_user=Depends(require_viewer),

):

    dataset, dataframe = load_dataset_for_analysis(
        dataset_id,
        db,
        current_user,
    )

    result = execute_analysis(
        generate_quality_report,
        dataframe,
        "Quality report generation failed",
    )

    return {

        "success": True,

        "dataset": get_dataset_metadata(dataset),

        "report": result,

    }