from sqlalchemy import select
from sqlalchemy.orm import Session

from database.models import User
from app.core.security import hash_password, verify_password


# ==========================================
# CREATE USER
# ==========================================

def create_user(
    db: Session,
    full_name: str,
    email: str,
    password: str,
    role_id: int
) -> User:

    # Check duplicate email
    existing_user = get_user_by_email(db, email)

    if existing_user:
        raise ValueError("Email address is already registered.")

    new_user = User(
        full_name=full_name,
        email=email,
        hashed_password=hash_password(password),
        role_id=role_id,
        is_active=True
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return new_user

    except Exception:
        db.rollback()
        raise


# ==========================================
# GET USER BY ID
# ==========================================

def get_user_by_id(
    db: Session,
    user_id: int
) -> User | None:

    statement = select(User).where(
        User.id == user_id
    )

    return db.execute(statement).scalar_one_or_none()


# ==========================================
# GET USER BY EMAIL
# ==========================================

def get_user_by_email(
    db: Session,
    email: str
) -> User | None:

    statement = select(User).where(
        User.email == email
    )

    return db.execute(statement).scalar_one_or_none()


# ==========================================
# GET ALL USERS
# ==========================================

def get_all_users(
    db: Session
) -> list[User]:

    statement = select(User).order_by(User.id)

    return list(
        db.execute(statement).scalars().all()
    )


# ==========================================
# UPDATE USER
# ==========================================

def update_user(
    db: Session,
    user_id: int,
    full_name: str | None = None,
    email: str | None = None,
    password: str | None = None,
    role_id: int | None = None,
    is_active: bool | None = None
) -> User | None:

    user = get_user_by_id(db, user_id)

    if user is None:
        return None

    if email is not None and email != user.email:

        existing_user = get_user_by_email(db, email)

        if existing_user:
            raise ValueError("Email address is already registered.")

        user.email = email

    if full_name is not None:
        user.full_name = full_name

    if password is not None:
        user.hashed_password = hash_password(password)

    if role_id is not None:
        user.role_id = role_id

    if is_active is not None:
        user.is_active = is_active

    try:
        db.commit()
        db.refresh(user)

        return user

    except Exception:
        db.rollback()
        raise


# ==========================================
# DELETE USER
# ==========================================

def delete_user(
    db: Session,
    user_id: int
) -> bool:

    user = get_user_by_id(db, user_id)

    if user is None:
        return False

    try:
        db.delete(user)
        db.commit()

        return True

    except Exception:
        db.rollback()
        raise


# ==========================================
# AUTHENTICATE USER
# ==========================================

def authenticate_user(
    db: Session,
    email: str,
    password: str
) -> User | None:

    user = get_user_by_email(db, email)

    if user is None:
        return None

    if not user.is_active:
        return None

    if not verify_password(
        password,
        user.hashed_password
    ):
        return None

    return user