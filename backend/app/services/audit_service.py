from sqlalchemy.orm import Session

from database.repositories import audit_repository


# ==========================================
# RECORD AUDIT EVENT
# ==========================================

def record_audit_event(
    db: Session,
    action: str,
    details: dict,
    dataset_id: int | None = None,
    actor_id: int | None = None,
):

    return audit_repository.create_audit_event(
        db=db,
        action=action,
        details=details,
        dataset_id=dataset_id,
        actor_id=actor_id,
    )


# ==========================================
# RECORD DATASET VERSION CREATION
# ==========================================

def record_version_creation(
    db: Session,
    dataset_id: int,
    version_id: int,
    version_number: int,
    operation_type: str,
    actor_id: int,
):

    details = {
        "version_id": version_id,
        "version_number": version_number,
        "operation_type": operation_type,
    }

    return record_audit_event(
        db=db,
        dataset_id=dataset_id,
        actor_id=actor_id,
        action="dataset_version_created",
        details=details,
    )


# ==========================================
# RECORD VERSION RESTORATION
# ==========================================

def record_version_restoration(
    db: Session,
    dataset_id: int,
    source_version_id: int,
    new_version_id: int,
    new_version_number: int,
    actor_id: int,
):

    details = {
        "source_version_id": source_version_id,
        "new_version_id": new_version_id,
        "new_version_number": new_version_number,
    }

    return record_audit_event(
        db=db,
        dataset_id=dataset_id,
        actor_id=actor_id,
        action="dataset_version_restored",
        details=details,
    )


# ==========================================
# GET DATASET AUDIT HISTORY
# ==========================================

def get_dataset_history(
    db: Session,
    dataset_id: int,
    limit: int = 50,
    offset: int = 0,
):

    return audit_repository.get_dataset_audit_history(
        db=db,
        dataset_id=dataset_id,
        limit=limit,
        offset=offset,
    )