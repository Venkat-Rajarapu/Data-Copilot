import json
import uuid
import shutil

from pathlib import Path

import pandas as pd

from sqlalchemy.orm import Session

from database.repositories.dataset_version_repository import (
    create_dataset_version,
    get_dataset_versions,
    get_next_version_number,
    get_version_by_id,
)

from database.repositories.audit_repository import (
    create_audit_event,
)

from app.services.dataset_service import (
    UPLOAD_DIR,
    validate_stored_file_path,
)


# ============================================================
# VERSION CONFIGURATION
# ============================================================

VERSION_DIRECTORY = UPLOAD_DIR / "versions"


# ============================================================
# DIRECTORY MANAGEMENT
# ============================================================

def ensure_version_directory():

    VERSION_DIRECTORY.mkdir(
        parents=True,
        exist_ok=True,
    )


# ============================================================
# DATAFRAME FILE WRITER
# ============================================================

def save_dataframe_to_file(
    dataframe: pd.DataFrame,
    file_path: Path,
):

    extension = file_path.suffix.lower()

    if extension == ".csv":

        dataframe.to_csv(
            file_path,
            index=False,
        )

    elif extension == ".xlsx":

        dataframe.to_excel(
            file_path,
            index=False,
            engine="openpyxl",
        )

    elif extension == ".xls":

        raise ValueError(
            "Applying changes to legacy XLS files is not supported. "
            "Please upload the dataset in CSV or XLSX format."
        )

    else:

        raise ValueError(
            f"Unsupported dataset format: {extension}"
        )


# ============================================================
# VERSION FILE CREATION
# ============================================================

def create_version_file(
    dataframe: pd.DataFrame,
    dataset_id: int,
    version_number: int,
    extension: str,
):

    ensure_version_directory()

    unique_id = uuid.uuid4().hex

    filename = (
        f"dataset_{dataset_id}_"
        f"v{version_number}_"
        f"{unique_id}{extension}"
    )

    final_path = VERSION_DIRECTORY / filename

    temporary_path = VERSION_DIRECTORY / (
        f".{unique_id}.tmp{extension}"
    )

    try:

        save_dataframe_to_file(
            dataframe,
            temporary_path,
        )

        temporary_path.replace(final_path)

        return final_path

    except Exception:

        if temporary_path.exists():
            temporary_path.unlink()

        if final_path.exists():
            final_path.unlink()

        raise


# ============================================================
# COPY EXISTING VERSION FILE
# ============================================================

def copy_version_file(
    source_path: Path,
    dataset_id: int,
    version_number: int,
):

    ensure_version_directory()

    extension = source_path.suffix.lower()

    unique_id = uuid.uuid4().hex

    filename = (
        f"dataset_{dataset_id}_"
        f"v{version_number}_"
        f"restored_{unique_id}{extension}"
    )

    final_path = VERSION_DIRECTORY / filename

    temporary_path = VERSION_DIRECTORY / (
        f".{unique_id}.tmp{extension}"
    )

    try:

        shutil.copy2(
            source_path,
            temporary_path,
        )

        temporary_path.replace(final_path)

        return final_path

    except Exception:

        if temporary_path.exists():
            temporary_path.unlink()

        if final_path.exists():
            final_path.unlink()

        raise


# ============================================================
# SAVE NEW DATASET VERSION
# ============================================================

def save_dataset_version(
    db: Session,
    dataset,
    dataframe: pd.DataFrame,
    user_id: int,
    operation_type: str,
    operation_config: dict | None = None,
):

    created_file_path = None

    try:

        current_file_path = validate_stored_file_path(
            dataset.file_path
        )

        extension = current_file_path.suffix.lower()

        if extension not in [".csv", ".xlsx"]:

            raise ValueError(
                "Version tracking supports CSV and XLSX files."
            )

        versions = get_dataset_versions(
            db,
            dataset.id,
        )

        # Create original baseline version.

        if not versions:

            create_dataset_version(
                db=db,
                dataset_id=dataset.id,
                version_number=1,
                file_path=str(current_file_path),
                file_size=current_file_path.stat().st_size,
                row_count=dataset.row_count,
                column_count=dataset.column_count,
                operation_type="original_upload",
                operation_config={
                    "description": "Original uploaded dataset"
                },
                created_by=user_id,
                source_version_id=None,
            )

        next_version = get_next_version_number(
            db,
            dataset.id,
        )

        created_file_path = create_version_file(
            dataframe=dataframe,
            dataset_id=dataset.id,
            version_number=next_version,
            extension=extension,
        )

        file_size = created_file_path.stat().st_size

        version = create_dataset_version(
            db=db,
            dataset_id=dataset.id,
            version_number=next_version,
            file_path=str(created_file_path),
            file_size=file_size,
            row_count=len(dataframe),
            column_count=len(dataframe.columns),
            operation_type=operation_type,
            operation_config=json.loads(
                json.dumps(
                    operation_config or {},
                    default=str,
                )
            ),
            created_by=user_id,
            source_version_id=None,
        )

        create_audit_event(
            db=db,
            dataset_id=dataset.id,
            actor_id=user_id,
            action="dataset_version_created",
            details={
                "version_id": version.id,
                "version_number": next_version,
                "operation_type": operation_type,
                "row_count": len(dataframe),
                "column_count": len(dataframe.columns),
            },
        )

        dataset.file_path = str(created_file_path)
        dataset.file_size = file_size
        dataset.row_count = len(dataframe)
        dataset.column_count = len(dataframe.columns)

        db.commit()

        db.refresh(dataset)
        db.refresh(version)

        return version

    except Exception:

        db.rollback()

        if created_file_path and created_file_path.exists():
            created_file_path.unlink()

        raise


# ============================================================
# RESTORE DATASET VERSION
# ============================================================

def restore_dataset_version(
    db: Session,
    dataset,
    version_id: int,
    user_id: int,
):

    restored_file_path = None

    try:

        # ----------------------------------------------------
        # Find selected version
        # ----------------------------------------------------

        source_version = get_version_by_id(
            db=db,
            version_id=version_id,
        )

        if source_version is None:

            raise ValueError(
                "Selected dataset version does not exist."
            )

        # ----------------------------------------------------
        # Verify version belongs to dataset
        # ----------------------------------------------------

        if source_version.dataset_id != dataset.id:

            raise ValueError(
                "Selected version does not belong to this dataset."
            )

        # ----------------------------------------------------
        # Validate original version file
        # ----------------------------------------------------

        source_file_path = validate_stored_file_path(
            source_version.file_path
        )

        # ----------------------------------------------------
        # Determine new version number
        # ----------------------------------------------------

        next_version = get_next_version_number(
            db,
            dataset.id,
        )

        # ----------------------------------------------------
        # Copy selected version into a new file
        # ----------------------------------------------------

        restored_file_path = copy_version_file(
            source_path=source_file_path,
            dataset_id=dataset.id,
            version_number=next_version,
        )

        file_size = restored_file_path.stat().st_size

        # ----------------------------------------------------
        # Create restoration version record
        # ----------------------------------------------------

        restored_version = create_dataset_version(
            db=db,
            dataset_id=dataset.id,
            version_number=next_version,
            file_path=str(restored_file_path),
            file_size=file_size,
            row_count=source_version.row_count,
            column_count=source_version.column_count,
            operation_type="version_restoration",
            operation_config={
                "restored_from_version": source_version.version_number,
                "restored_from_version_id": source_version.id,
            },
            created_by=user_id,
            source_version_id=source_version.id,
        )

        # ----------------------------------------------------
        # Record restoration audit event
        # ----------------------------------------------------

        create_audit_event(
            db=db,
            dataset_id=dataset.id,
            actor_id=user_id,
            action="dataset_version_restored",
            details={
                "source_version_id": source_version.id,
                "source_version_number": source_version.version_number,
                "new_version_id": restored_version.id,
                "new_version_number": next_version,
            },
        )

        # ----------------------------------------------------
        # Update active dataset
        # ----------------------------------------------------

        dataset.file_path = str(restored_file_path)
        dataset.file_size = file_size
        dataset.row_count = source_version.row_count
        dataset.column_count = source_version.column_count

        # ----------------------------------------------------
        # Commit transaction
        # ----------------------------------------------------

        db.commit()

        db.refresh(dataset)
        db.refresh(restored_version)

        return restored_version

    except Exception:

        db.rollback()

        if restored_file_path and restored_file_path.exists():
            restored_file_path.unlink()

        raise