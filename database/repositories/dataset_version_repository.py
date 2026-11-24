from sqlalchemy import select, func
from sqlalchemy.orm import Session

from database.models import DatasetVersion


# ==========================================
# CREATE DATASET VERSION
# ==========================================

def create_dataset_version(
    db: Session,
    dataset_id: int,
    version_number: int,
    file_path: str,
    file_size: int,
    row_count: int,
    column_count: int,
    operation_type: str,
    operation_config: dict,
    created_by: int | None = None,
    source_version_id: int | None = None,
) -> DatasetVersion:

    version = DatasetVersion(
        dataset_id=dataset_id,
        version_number=version_number,
        file_path=file_path,
        file_size=file_size,
        row_count=row_count,
        column_count=column_count,
        operation_type=operation_type,
        operation_config=operation_config,
        created_by=created_by,
        source_version_id=source_version_id,
    )

    try:
        db.add(version)
        db.flush()
        db.refresh(version)

        return version

    except Exception:
        db.rollback()
        raise


# ==========================================
# GET VERSION BY ID
# ==========================================

def get_version_by_id(
    db: Session,
    version_id: int,
) -> DatasetVersion | None:

    statement = select(DatasetVersion).where(
        DatasetVersion.id == version_id
    )

    return db.execute(
        statement
    ).scalar_one_or_none()


# ==========================================
# GET DATASET VERSIONS
# ==========================================

def get_dataset_versions(
    db: Session,
    dataset_id: int,
) -> list[DatasetVersion]:

    statement = (
        select(DatasetVersion)
        .where(
            DatasetVersion.dataset_id == dataset_id
        )
        .order_by(
            DatasetVersion.version_number.desc()
        )
    )

    return list(
        db.execute(statement).scalars().all()
    )


# ==========================================
# GET LATEST VERSION
# ==========================================

def get_latest_dataset_version(
    db: Session,
    dataset_id: int,
) -> DatasetVersion | None:

    statement = (
        select(DatasetVersion)
        .where(
            DatasetVersion.dataset_id == dataset_id
        )
        .order_by(
            DatasetVersion.version_number.desc()
        )
        .limit(1)
    )

    return db.execute(
        statement
    ).scalar_one_or_none()


# ==========================================
# GET NEXT VERSION NUMBER
# ==========================================

def get_next_version_number(
    db: Session,
    dataset_id: int,
) -> int:

    statement = select(
        func.max(DatasetVersion.version_number)
    ).where(
        DatasetVersion.dataset_id == dataset_id
    )

    latest_number = db.execute(
        statement
    ).scalar_one()

    return (latest_number or 0) + 1