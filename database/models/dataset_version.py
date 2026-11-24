from datetime import datetime, timezone

from sqlalchemy import (
    BigInteger,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from database.models.base import Base


class DatasetVersion(Base):

    __tablename__ = "dataset_versions"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    dataset_id: Mapped[int] = mapped_column(
        ForeignKey("datasets.id", ondelete="CASCADE"),
        nullable=False,
    )

    version_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    file_path: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    file_size: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
    )

    row_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    column_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    operation_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    operation_config: Mapped[dict] = mapped_column(
        JSON,
        default=dict,
        nullable=False,
    )

    source_version_id: Mapped[int | None] = mapped_column(
        ForeignKey("dataset_versions.id", ondelete="SET NULL"),
        nullable=True,
    )

    created_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "dataset_id",
            "version_number",
            name="uq_dataset_version_number",
        ),
        Index(
            "ix_dataset_versions_dataset_id",
            "dataset_id",
        ),
    )