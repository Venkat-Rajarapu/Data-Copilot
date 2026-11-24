from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    Query,
    status,
)

from sqlalchemy.orm import Session

from app.db.dependencies import get_db

from app.core.permissions import (
    require_analyst,
    require_viewer,
)

from app.schemas.dataset import (
    DatasetUpdate,
    DatasetResponse,
)

from app.services.dataset_service import (
    upload_dataset,
    delete_dataset_file,
    preview_dataset_file,
)

from database.repositories import (
    dataset_repository,
    user_repository,
)


# ==========================================
# ROUTER
# ==========================================

router = APIRouter(
    prefix="/datasets",
    tags=["Datasets"],
)


# ==========================================
# HELPER: VERIFY DATASET ACCESS
# ==========================================

def verify_dataset_access(
    dataset,
    current_user,
):

    # Admin can access all datasets.

    if current_user.role_id == 1:

        return

    # Other users can access only their own datasets.

    if dataset.owner_id != current_user.id:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this dataset.",
        )


# ==========================================
# 1. UPLOAD DATASET
# ==========================================

@router.post(
    "/upload",
    response_model=DatasetResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_dataset(
    name: str = Form(
        ...,
        min_length=2,
        max_length=150,
    ),

    file: UploadFile = File(...),

    owner_id: int | None = Form(
        default=None,
        gt=0,
    ),

    db: Session = Depends(get_db),

    current_user=Depends(require_analyst),
):

    # Default owner is authenticated user.

    target_owner_id = current_user.id

    # Only admin can assign another owner.

    if current_user.role_id == 1 and owner_id is not None:

        target_owner_id = owner_id

    elif current_user.role_id != 1 and owner_id is not None:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can assign another dataset owner.",
        )

    # Verify owner exists.

    owner = user_repository.get_user_by_id(
        db=db,
        user_id=target_owner_id,
    )

    if owner is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset owner not found.",
        )

    # Upload and process file.

    file_metadata = await upload_dataset(
        file
    )

    try:

        # Store metadata in PostgreSQL.

        dataset = dataset_repository.create_dataset(
            db=db,
            name=name,
            original_filename=file_metadata["original_filename"],
            file_path=file_metadata["file_path"],
            file_type=file_metadata["file_type"],
            file_size=file_metadata["file_size"],
            row_count=file_metadata["row_count"],
            column_count=file_metadata["column_count"],
            status=file_metadata["status"],
            owner_id=target_owner_id,
        )

        return dataset

    except Exception:

        # Remove uploaded physical file if DB insertion fails.

        delete_dataset_file(
            file_metadata["file_path"]
        )

        raise


# ==========================================
# 2. GET ALL DATASETS
# ==========================================

@router.get(
    "/",
    response_model=list[DatasetResponse],
)
def get_all_datasets(
    db: Session = Depends(get_db),

    current_user=Depends(require_viewer),
):

    # Admin can view all datasets.

    if current_user.role_id == 1:

        datasets = dataset_repository.get_all_datasets(
            db=db,
        )

    else:

        # Other users can view their own datasets.

        datasets = dataset_repository.get_datasets_by_owner(
            db=db,
            owner_id=current_user.id,
        )

    return datasets


# ==========================================
# 3. GET DATASETS BY OWNER
# ==========================================

@router.get(
    "/owner/{owner_id}",
    response_model=list[DatasetResponse],
)
def get_datasets_by_owner(
    owner_id: int,

    db: Session = Depends(get_db),

    current_user=Depends(require_viewer),
):

    # Verify owner permissions.

    if current_user.role_id != 1 and owner_id != current_user.id:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot access another user's datasets.",
        )

    # Verify owner exists.

    owner = user_repository.get_user_by_id(
        db=db,
        user_id=owner_id,
    )

    if owner is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    datasets = dataset_repository.get_datasets_by_owner(
        db=db,
        owner_id=owner_id,
    )

    return datasets


# ==========================================
# 4. PREVIEW DATASET
# ==========================================

@router.get(
    "/{dataset_id}/preview",
)
def preview_dataset(
    dataset_id: int,

    limit: int = Query(
        default=50,
        ge=1,
        le=200,
    ),

    offset: int = Query(
        default=0,
        ge=0,
    ),

    search: str | None = Query(
        default=None,
        max_length=200,
    ),

    db: Session = Depends(get_db),

    current_user=Depends(require_viewer),
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

    # Verify dataset access.

    verify_dataset_access(
        dataset=dataset,
        current_user=current_user,
    )

    # Generate preview from actual uploaded file.

    preview = preview_dataset_file(
        file_path=dataset.file_path,
        file_type=dataset.file_type,
        limit=limit,
        offset=offset,
        search=search,
    )

    return {
        "dataset_id": dataset.id,

        "dataset_name": dataset.name,

        "file_type": dataset.file_type,

        **preview,
    }


# ==========================================
# 5. GET DATASET BY ID
# ==========================================

@router.get(
    "/{dataset_id}",
    response_model=DatasetResponse,
)
def get_dataset(
    dataset_id: int,

    db: Session = Depends(get_db),

    current_user=Depends(require_viewer),
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
        dataset=dataset,
        current_user=current_user,
    )

    return dataset


# ==========================================
# 6. UPDATE DATASET
# ==========================================

@router.put(
    "/{dataset_id}",
    response_model=DatasetResponse,
)
def update_dataset(
    dataset_id: int,

    dataset_data: DatasetUpdate,

    db: Session = Depends(get_db),

    current_user=Depends(require_analyst),
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
        dataset=dataset,
        current_user=current_user,
    )

    update_data = dataset_data.model_dump(
        exclude_unset=True
    )

    updated_dataset = dataset_repository.update_dataset(
        db=db,
        dataset_id=dataset_id,
        **update_data,
    )

    return updated_dataset


# ==========================================
# 7. DELETE DATASET
# ==========================================

@router.delete(
    "/{dataset_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_dataset(
    dataset_id: int,

    db: Session = Depends(get_db),

    current_user=Depends(require_analyst),
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
        dataset=dataset,
        current_user=current_user,
    )

    # Delete database record.

    dataset_repository.delete_dataset(
        db=db,
        dataset_id=dataset_id,
        owner_id=dataset.owner_id,
    )

    # Delete physical file.

    delete_dataset_file(
        dataset.file_path
    )

    return None