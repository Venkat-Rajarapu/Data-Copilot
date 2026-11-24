from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy.orm import Session

from app.db.dependencies import get_db

from app.core.permissions import require_analyst

from app.schemas.data_processing import (
    DataTypeConversionRequest,
    OutlierTreatmentRequest,
    DataTransformationRequest,
)

from app.services.data_processing_service import (
    preview_data_type_conversion,
    preview_outlier_treatment,
    preview_data_transformation,
)

from database.repositories import dataset_repository


# ==========================================
# ROUTER
# ==========================================

router = APIRouter(
    prefix="/data-processing",
    tags=["Data Processing"],
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
            detail="You do not have permission to process this dataset.",
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
# PHASE 6.3 - DATA TYPE CONVERSION
# ==========================================

@router.post(
    "/datasets/{dataset_id}/type-conversion/preview",
)
def preview_data_type_conversion_endpoint(

    dataset_id: int,

    request: DataTypeConversionRequest,

    db: Session = Depends(get_db),

    current_user=Depends(require_analyst),

):

    dataset = get_accessible_dataset(
        dataset_id,
        db,
        current_user,
    )

    result = preview_data_type_conversion(

        file_path=dataset.file_path,

        file_type=dataset.file_type,

        columns=request.columns,

        target_type=request.target_type,

        preview_limit=request.preview_limit,
    )

    return {

        "success": True,

        "message": "Data type conversion preview generated successfully.",

        "dataset": {

            "id": dataset.id,

            "name": dataset.name,

            "filename": dataset.original_filename,

            "file_type": dataset.file_type,
        },

        **result,
    }


# ==========================================
# PHASE 6.4 - OUTLIER TREATMENT
# ==========================================

@router.post(
    "/datasets/{dataset_id}/outlier-treatment/preview",
)
def preview_outlier_treatment_endpoint(

    dataset_id: int,

    request: OutlierTreatmentRequest,

    db: Session = Depends(get_db),

    current_user=Depends(require_analyst),

):

    dataset = get_accessible_dataset(
        dataset_id,
        db,
        current_user,
    )

    result = preview_outlier_treatment(

        file_path=dataset.file_path,

        file_type=dataset.file_type,

        columns=request.columns,

        method=request.method,

        treatment=request.treatment,

        preview_limit=request.preview_limit,
    )

    return {

        "success": True,

        "message": "Outlier treatment preview generated successfully.",

        "dataset": {

            "id": dataset.id,

            "name": dataset.name,

            "filename": dataset.original_filename,

            "file_type": dataset.file_type,
        },

        **result,
    }


# ==========================================
# PHASE 6.5 - DATA TRANSFORMATION
# ==========================================

@router.post(
    "/datasets/{dataset_id}/transformation/preview",
)
def preview_data_transformation_endpoint(

    dataset_id: int,

    request: DataTransformationRequest,

    db: Session = Depends(get_db),

    current_user=Depends(require_analyst),

):

    # GET ACCESSIBLE DATASET

    dataset = get_accessible_dataset(
        dataset_id,
        db,
        current_user,
    )

    # GENERATE TRANSFORMATION PREVIEW

    result = preview_data_transformation(

        file_path=dataset.file_path,

        file_type=dataset.file_type,

        columns=request.columns,

        operation=request.operation,

        new_name=request.new_name,

        preview_limit=request.preview_limit,
    )

    # FINAL RESPONSE

    return {

        "success": True,

        "message": "Data transformation preview generated successfully.",

        "dataset": {

            "id": dataset.id,

            "name": dataset.name,

            "filename": dataset.original_filename,

            "file_type": dataset.file_type,
        },

        **result,
    }