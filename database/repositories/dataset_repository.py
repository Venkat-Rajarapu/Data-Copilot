from sqlalchemy import select
from sqlalchemy.orm import Session

from database.models import Dataset


# ==========================================
# CREATE DATASET
# ==========================================

def create_dataset(
    db: Session,
    name: str,
    original_filename: str,
    file_path: str,
    file_type: str,
    file_size: int,
    owner_id: int,
    row_count: int = 0,
    column_count: int = 0,
    status: str = "uploaded"
) -> Dataset:

    new_dataset = Dataset(
        name=name,
        original_filename=original_filename,
        file_path=file_path,
        file_type=file_type,
        file_size=file_size,
        row_count=row_count,
        column_count=column_count,
        status=status,
        owner_id=owner_id
    )

    try:
        db.add(new_dataset)
        db.commit()
        db.refresh(new_dataset)

        return new_dataset

    except Exception:
        db.rollback()
        raise


# ==========================================
# GET DATASET BY ID
# ==========================================

def get_dataset_by_id(
    db: Session,
    dataset_id: int
) -> Dataset | None:

    statement = select(Dataset).where(
        Dataset.id == dataset_id
    )

    return db.execute(statement).scalar_one_or_none()


# ==========================================
# GET DATASETS BY OWNER
# ==========================================

def get_datasets_by_owner(
    db: Session,
    owner_id: int
) -> list[Dataset]:

    statement = (
        select(Dataset)
        .where(Dataset.owner_id == owner_id)
        .order_by(Dataset.created_at.desc())
    )

    return list(
        db.execute(statement).scalars().all()
    )


# ==========================================
# GET ALL DATASETS
# ==========================================

def get_all_datasets(
    db: Session
) -> list[Dataset]:

    statement = select(Dataset).order_by(
        Dataset.created_at.desc()
    )

    return list(
        db.execute(statement).scalars().all()
    )


# ==========================================
# UPDATE DATASET
# ==========================================

def update_dataset(
    db: Session,
    dataset_id: int,
    name: str | None = None,
    row_count: int | None = None,
    column_count: int | None = None,
    status: str | None = None
) -> Dataset | None:

    dataset = get_dataset_by_id(db, dataset_id)

    if dataset is None:
        return None

    if name is not None:
        dataset.name = name

    if row_count is not None:
        dataset.row_count = row_count

    if column_count is not None:
        dataset.column_count = column_count

    if status is not None:
        dataset.status = status

    try:
        db.commit()
        db.refresh(dataset)

        return dataset

    except Exception:
        db.rollback()
        raise


# ==========================================
# DELETE DATASET
# ==========================================

def delete_dataset(
    db: Session,
    dataset_id: int,
    owner_id: int | None = None
) -> bool:

    statement = select(Dataset).where(
        Dataset.id == dataset_id
    )

    if owner_id is not None:
        statement = statement.where(
            Dataset.owner_id == owner_id
        )

    dataset = db.execute(
        statement
    ).scalar_one_or_none()

    if dataset is None:
        return False

    try:
        db.delete(dataset)
        db.commit()

        return True

    except Exception:
        db.rollback()
        raise