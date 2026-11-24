from sqlalchemy import select
from sqlalchemy.orm import Session

from database.models import Role


# ==========================================
# CREATE ROLE
# ==========================================

def create_role(
    db: Session,
    name: str,
    description: str | None = None
) -> Role:
    """
    Create a new role in the database.
    """

    new_role = Role(
        name=name,
        description=description
    )

    try:
        db.add(new_role)
        db.commit()
        db.refresh(new_role)

        return new_role

    except Exception:
        db.rollback()
        raise


# ==========================================
# GET ROLE BY ID
# ==========================================

def get_role_by_id(
    db: Session,
    role_id: int
) -> Role | None:
    """
    Retrieve a role using its ID.
    """

    statement = select(Role).where(
        Role.id == role_id
    )

    return db.execute(statement).scalar_one_or_none()


# ==========================================
# GET ROLE BY NAME
# ==========================================

def get_role_by_name(
    db: Session,
    name: str
) -> Role | None:
    """
    Retrieve a role using its name.
    """

    statement = select(Role).where(
        Role.name == name
    )

    return db.execute(statement).scalar_one_or_none()


# ==========================================
# GET ALL ROLES
# ==========================================

def get_all_roles(
    db: Session
) -> list[Role]:
    """
    Retrieve all available roles.
    """

    statement = select(Role).order_by(Role.id)

    return list(
        db.execute(statement).scalars().all()
    )


# ==========================================
# UPDATE ROLE
# ==========================================

def update_role(
    db: Session,
    role_id: int,
    name: str | None = None,
    description: str | None = None
) -> Role | None:
    """
    Update an existing role.
    """

    role = get_role_by_id(db, role_id)

    if role is None:
        return None

    if name is not None:
        role.name = name

    if description is not None:
        role.description = description

    try:
        db.commit()
        db.refresh(role)

        return role

    except Exception:
        db.rollback()
        raise


# ==========================================
# DELETE ROLE
# ==========================================

def delete_role(
    db: Session,
    role_id: int
) -> bool:
    """
    Delete a role using its ID.

    Returns False if the role does not exist.
    """

    role = get_role_by_id(db, role_id)

    if role is None:
        return False

    try:
        db.delete(role)
        db.commit()

        return True

    except Exception:
        db.rollback()
        raise