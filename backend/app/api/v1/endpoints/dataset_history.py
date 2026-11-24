from io import BytesIO

import pandas as pd

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)

from fastapi.responses import StreamingResponse

from sqlalchemy.orm import Session

from app.db.dependencies import get_db

from app.core.permissions import (
    require_viewer,
    require_analyst,
)

from app.services.audit_service import get_dataset_history

from app.services.version_service import restore_dataset_version

from app.services.dataset_service import validate_stored_file_path

from database.repositories import (
    dataset_repository,
    get_dataset_versions,
)

from database.repositories.dataset_version_repository import (
    get_version_by_id,
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/dataset-history",
    tags=["Dataset History & Version Tracking"],
)


# ============================================================
# VERIFY DATASET ACCESS
# ============================================================

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

    # Admin can access all datasets.
    if current_user.role_id == 1:
        return dataset

    # Analysts and Viewers can access their own datasets.
    if dataset.owner_id != current_user.id:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this dataset.",
        )

    return dataset


# ============================================================
# DATASET EXPORT HELPER
# ============================================================

def create_export_response(
    file_path: str,
    export_format: str,
    download_filename: str,
):

    try:

        # Validate stored file path.
        validated_path = validate_stored_file_path(
            file_path
        )

        if not validated_path.exists():

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dataset file not found.",
            )

        extension = validated_path.suffix.lower()

        # ----------------------------------------------------
        # READ CSV
        # ----------------------------------------------------

        if extension == ".csv":

            dataframe = pd.read_csv(
                validated_path
            )

        # ----------------------------------------------------
        # READ EXCEL
        # ----------------------------------------------------

        elif extension in [".xlsx", ".xls"]:

            dataframe = pd.read_excel(
                validated_path
            )

        else:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported source dataset format.",
            )

        # ----------------------------------------------------
        # CSV EXPORT
        # ----------------------------------------------------

        if export_format == "csv":

            output = dataframe.to_csv(
                index=False,
            ).encode("utf-8-sig")

            media_type = "text/csv"

            filename = f"{download_filename}.csv"

        # ----------------------------------------------------
        # EXCEL EXPORT
        # ----------------------------------------------------

        elif export_format == "xlsx":

            buffer = BytesIO()

            dataframe.to_excel(
                buffer,
                index=False,
                engine="openpyxl",
            )

            buffer.seek(0)

            output = buffer.getvalue()

            media_type = (
                "application/vnd.openxmlformats-officedocument."
                "spreadsheetml.sheet"
            )

            filename = f"{download_filename}.xlsx"

        else:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Export format must be csv or xlsx.",
            )

        # ----------------------------------------------------
        # RETURN DOWNLOAD RESPONSE
        # ----------------------------------------------------

        return StreamingResponse(
            BytesIO(output),
            media_type=media_type,
            headers={
                "Content-Disposition": (
                    f'attachment; filename="{filename}"'
                )
            },
        )

    except HTTPException:
        raise

    except Exception:

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to export dataset.",
        )


# ============================================================
# GET DATASET VERSIONS
# ============================================================

@router.get(
    "/datasets/{dataset_id}/versions",
)
def get_dataset_versions_endpoint(
    dataset_id: int,

    db: Session = Depends(get_db),

    current_user=Depends(require_viewer),
):

    dataset = get_accessible_dataset(
        dataset_id=dataset_id,
        db=db,
        current_user=current_user,
    )

    versions = get_dataset_versions(
        db=db,
        dataset_id=dataset.id,
    )

    return {
        "success": True,

        "message": "Dataset versions retrieved successfully.",

        "dataset": {
            "id": dataset.id,
            "name": dataset.name,
            "filename": dataset.original_filename,
            "current_file_type": dataset.file_type,
        },

        "total_versions": len(versions),

        "versions": [
            {
                "id": version.id,
                "version_number": version.version_number,
                "operation_type": version.operation_type,
                "operation_config": version.operation_config,
                "source_version_id": version.source_version_id,
                "file_size": version.file_size,
                "row_count": version.row_count,
                "column_count": version.column_count,
                "created_by": version.created_by,

                "created_at": (
                    version.created_at.isoformat()
                    if version.created_at
                    else None
                ),

                "is_current": (
                    version.file_path == dataset.file_path
                ),
            }

            for version in versions
        ],
    }


# ============================================================
# GET DATASET AUDIT HISTORY
# ============================================================

@router.get(
    "/datasets/{dataset_id}/history",
)
def get_dataset_audit_history_endpoint(
    dataset_id: int,

    limit: int = Query(
        default=50,
        ge=1,
        le=100,
    ),

    offset: int = Query(
        default=0,
        ge=0,
    ),

    db: Session = Depends(get_db),

    current_user=Depends(require_viewer),
):

    dataset = get_accessible_dataset(
        dataset_id=dataset_id,
        db=db,
        current_user=current_user,
    )

    history = get_dataset_history(
        db=db,
        dataset_id=dataset.id,
        limit=limit,
        offset=offset,
    )

    return {
        "success": True,

        "message": "Dataset audit history retrieved successfully.",

        "dataset_id": dataset.id,

        "total_events": len(history),

        "limit": limit,

        "offset": offset,

        "history": [
            {
                "id": event.id,
                "action": event.action,
                "details": event.details,
                "actor_id": event.actor_id,

                "created_at": (
                    event.created_at.isoformat()
                    if event.created_at
                    else None
                ),
            }

            for event in history
        ],
    }


# ============================================================
# RESTORE DATASET VERSION
# ============================================================

@router.post(
    "/datasets/{dataset_id}/versions/{version_id}/restore",
)
def restore_dataset_version_endpoint(
    dataset_id: int,

    version_id: int,

    db: Session = Depends(get_db),

    current_user=Depends(require_analyst),
):

    dataset = get_accessible_dataset(
        dataset_id=dataset_id,
        db=db,
        current_user=current_user,
    )

    try:

        restored_version = restore_dataset_version(
            db=db,
            dataset=dataset,
            version_id=version_id,
            user_id=current_user.id,
        )

        return {
            "success": True,

            "message": "Dataset version restored successfully.",

            "dataset_id": dataset.id,

            "restored_version": {
                "id": restored_version.id,

                "version_number": restored_version.version_number,

                "operation_type": restored_version.operation_type,

                "source_version_id": restored_version.source_version_id,

                "row_count": restored_version.row_count,

                "column_count": restored_version.column_count,

                "file_size": restored_version.file_size,
            },
        }

    except ValueError as error:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )

    except Exception:

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to restore dataset version.",
        )


# ============================================================
# EXPORT CURRENT DATASET
# ============================================================

@router.get(
    "/datasets/{dataset_id}/export",
)
def export_current_dataset_endpoint(
    dataset_id: int,

    export_format: str = Query(
        default="csv",
        alias="format",
        pattern="^(csv|xlsx)$",
    ),

    db: Session = Depends(get_db),

    current_user=Depends(require_viewer),
):

    dataset = get_accessible_dataset(
        dataset_id=dataset_id,
        db=db,
        current_user=current_user,
    )

    return create_export_response(
        file_path=dataset.file_path,
        export_format=export_format,
        download_filename=f"dataset_{dataset.id}_current",
    )


# ============================================================
# EXPORT HISTORICAL DATASET VERSION
# ============================================================

@router.get(
    "/datasets/{dataset_id}/versions/{version_id}/export",
)
def export_dataset_version_endpoint(
    dataset_id: int,

    version_id: int,

    export_format: str = Query(
        default="csv",
        alias="format",
        pattern="^(csv|xlsx)$",
    ),

    db: Session = Depends(get_db),

    current_user=Depends(require_viewer),
):

    dataset = get_accessible_dataset(
        dataset_id=dataset_id,
        db=db,
        current_user=current_user,
    )

    version = get_version_by_id(
        db=db,
        version_id=version_id,
    )

    if version is None or version.dataset_id != dataset.id:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset version not found.",
        )

    return create_export_response(
        file_path=version.file_path,
        export_format=export_format,
        download_filename=(
            f"dataset_{dataset.id}_v{version.version_number}"
        ),
    )