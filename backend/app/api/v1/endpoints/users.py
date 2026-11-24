from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from pydantic import Field
from sqlalchemy.orm import Session

from app.db.dependencies import get_db
from app.core.permissions import require_admin

from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserResponse,
)

from database.repositories import (
    user_repository,
    role_repository,
)


router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


# ==========================================
# ADMIN USER CREATION SCHEMA
# ==========================================

class AdminUserCreate(UserCreate):

    role_id: int = Field(
        ...,
        ge=2,
        le=3,
    )


# ==========================================
# HELPER: CREATE USER
# ==========================================

def create_user_account(
    db: Session,
    user_data,
    role_id: int,
):

    # Check duplicate email
    existing_user = user_repository.get_user_by_email(
        db=db,
        email=str(user_data.email),
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered.",
        )

    # Verify role exists
    role = role_repository.get_role_by_id(
        db=db,
        role_id=role_id,
    )

    if role is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requested role not found.",
        )

    # Create user
    try:
        user = user_repository.create_user(
            db=db,
            full_name=user_data.full_name,
            email=str(user_data.email),
            password=user_data.password,
            role_id=role_id,
        )

        return user

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        ) from error


# ==========================================
# 1. PUBLIC USER REGISTRATION
# VIEWER ROLE ONLY
# ==========================================

@router.post(
    "/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
):

    return create_user_account(
        db=db,
        user_data=user_data,
        role_id=3,
    )


# ==========================================
# 2. ADMIN CREATES ANALYST / VIEWER
# ADMIN ONLY
# ==========================================

@router.post(
    "/admin",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def admin_create_user(
    user_data: AdminUserCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):

    return create_user_account(
        db=db,
        user_data=user_data,
        role_id=user_data.role_id,
    )


# ==========================================
# 3. GET ALL USERS - ADMIN ONLY
# ==========================================

@router.get(
    "/",
    response_model=list[UserResponse],
)
def get_all_users(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):

    return user_repository.get_all_users(
        db=db,
    )


# ==========================================
# 4. GET USER BY ID - ADMIN ONLY
# ==========================================

@router.get(
    "/{user_id}",
    response_model=UserResponse,
)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):

    user = user_repository.get_user_by_id(
        db=db,
        user_id=user_id,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    return user


# ==========================================
# 5. UPDATE USER - ADMIN ONLY
# ==========================================

@router.put(
    "/{user_id}",
    response_model=UserResponse,
)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):

    user = user_repository.get_user_by_id(
        db=db,
        user_id=user_id,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    update_data = user_data.model_dump(
        exclude_unset=True
    )

    # Check duplicate email
    if update_data.get("email") is not None:

        email = str(update_data["email"])

        existing_user = user_repository.get_user_by_email(
            db=db,
            email=email,
        )

        if existing_user and existing_user.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered.",
            )

        update_data["email"] = email

    # Validate role
    if update_data.get("role_id") is not None:

        role = role_repository.get_role_by_id(
            db=db,
            role_id=update_data["role_id"],
        )

        if role is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found.",
            )

    try:
        updated_user = user_repository.update_user(
            db=db,
            user_id=user_id,
            **update_data,
        )

        return updated_user

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        ) from error


# ==========================================
# 6. DELETE USER - ADMIN ONLY
# ==========================================

@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):

    user = user_repository.get_user_by_id(
        db=db,
        user_id=user_id,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account.",
        )

    user_repository.delete_user(
        db=db,
        user_id=user_id,
    )

    return None