from sqlalchemy import select
from sqlalchemy.orm import Session

from database.models import AuditEvent


# ==========================================
# CREATE AUDIT EVENT
# ==========================================

def create_audit_event(
    db: Session,
    action: str,
    details: dict,
    dataset_id: int | None = None,
    actor_id: int | None = None,
) -> AuditEvent:

    event = AuditEvent(
        dataset_id=dataset_id,
        actor_id=actor_id,
        action=action,
        details=details,
    )

    try:
        db.add(event)
        db.flush()
        db.refresh(event)

        return event

    except Exception:
        db.rollback()
        raise


# ==========================================
# GET AUDIT EVENT BY ID
# ==========================================

def get_audit_event_by_id(
    db: Session,
    event_id: int,
) -> AuditEvent | None:

    statement = select(AuditEvent).where(
        AuditEvent.id == event_id
    )

    return db.execute(
        statement
    ).scalar_one_or_none()


# ==========================================
# GET DATASET AUDIT HISTORY
# ==========================================

def get_dataset_audit_history(
    db: Session,
    dataset_id: int,
    limit: int = 50,
    offset: int = 0,
) -> list[AuditEvent]:

    statement = (
        select(AuditEvent)
        .where(
            AuditEvent.dataset_id == dataset_id
        )
        .order_by(
            AuditEvent.created_at.desc(),
            AuditEvent.id.desc(),
        )
        .offset(offset)
        .limit(limit)
    )

    return list(
        db.execute(statement).scalars().all()
    )


# ==========================================
# GET USER AUDIT HISTORY
# ==========================================

def get_user_audit_history(
    db: Session,
    actor_id: int,
    limit: int = 50,
    offset: int = 0,
) -> list[AuditEvent]:

    statement = (
        select(AuditEvent)
        .where(
            AuditEvent.actor_id == actor_id
        )
        .order_by(
            AuditEvent.created_at.desc(),
            AuditEvent.id.desc(),
        )
        .offset(offset)
        .limit(limit)
    )

    return list(
        db.execute(statement).scalars().all()
    )