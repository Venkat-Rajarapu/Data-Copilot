from datetime import datetime, timezone

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column

from database.models.base import Base


class AuditEvent(Base):

    __tablename__ = "audit_events"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    dataset_id: Mapped[int | None] = mapped_column(
        ForeignKey("datasets.id", ondelete="SET NULL"),
        nullable=True,
    )

    actor_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    action: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    details: Mapped[dict] = mapped_column(
        JSON,
        default=dict,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        Index(
            "ix_audit_events_dataset_id",
            "dataset_id",
        ),
        Index(
            "ix_audit_events_actor_id",
            "actor_id",
        ),
        Index(
            "ix_audit_events_created_at",
            "created_at",
        ),
    )