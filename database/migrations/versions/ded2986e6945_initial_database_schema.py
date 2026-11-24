"""Initial database schema.

Revision ID: ded2986e6945
Revises:
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "ded2986e6945"

down_revision: Union[str, None] = None

branch_labels: Union[str, Sequence[str], None] = None

depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create initial database tables."""

    # Roles table
    op.create_table(
        "roles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.UniqueConstraint("name"),
    )

    # Users table
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("full_name", sa.String(length=150), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("role_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["role_id"], ["roles.id"]),
    )

    op.create_index(
        "ix_users_email",
        "users",
        ["email"],
        unique=True,
    )

    # Datasets table
    op.create_table(
        "datasets",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("original_filename", sa.String(length=255), nullable=False),
        sa.Column("file_path", sa.String(length=500), nullable=False),
        sa.Column("file_type", sa.String(length=20), nullable=False),
        sa.Column("file_size", sa.BigInteger(), nullable=False),
        sa.Column("row_count", sa.Integer(), nullable=False),
        sa.Column("column_count", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("owner_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"]),
    )


def downgrade() -> None:
    """Drop initial database tables."""

    op.drop_table("datasets")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

    op.drop_table("roles")