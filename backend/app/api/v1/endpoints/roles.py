from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.db.dependencies import get_db
from app.core.permissions import require_admin

from app.schemas.role import (
    RoleCreate,
    RoleUpdate,
    RoleResponse,
)

from database.repositories import role_repository


router = APIRouter(
    prefix="/roles",
    tags=["Roles"],
)


# ==========================================
# 1. CREATE ROLE
# ==========================================

@router.post(
    "/",
    response_model=RoleResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_role(
    role_data: RoleCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):

    existing_role = role_repository.get_role_by_name(
        db=db,
        name=role_data.name,
    )

    if existing_role:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Role already exists.",
        )

    role = role_repository.create_role(
        db=db,
        name=role_data.name,
        description=role_data.description,
    )

    return role


# ==========================================
# 2. GET ALL ROLES
# ==========================================

@router.get(
    "/",
    response_model=list[RoleResponse],
)
def get_all_roles(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):

    roles = role_repository.get_all_roles(db=db)

    return roles


# ==========================================
# 3. GET ROLE BY ID
# ==========================================

@router.get(
    "/{role_id}",
    response_model=RoleResponse,
)
def get_role(
    role_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):

    role = role_repository.get_role_by_id(
        db=db,
        role_id=role_id,
    )

    if role is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found.",
        )

    return role


# ==========================================
# 4. UPDATE ROLE
# ==========================================

@router.put(
    "/{role_id}",
    response_model=RoleResponse,
)
def update_role(
    role_id: int,
    role_data: RoleUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):

    role = role_repository.get_role_by_id(
        db=db,
        role_id=role_id,
    )

    if role is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found.",
        )

    update_data = role_data.model_dump(
        exclude_unset=True
    )

    if "name" in update_data and update_data["name"] is not None:

        existing_role = role_repository.get_role_by_name(
            db=db,
            name=update_data["name"],
        )

        if existing_role and existing_role.id != role_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Role name already exists.",
            )

    updated_role = role_repository.update_role(
        db=db,
        role_id=role_id,
        **update_data,
    )

    return updated_role


# ==========================================
# 5. DELETE ROLE
# ==========================================

@router.delete(
    "/{role_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_role(
    role_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):

    role = role_repository.get_role_by_id(
        db=db,
        role_id=role_id,
    )

    if role is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found.",
        )

    try:
        role_repository.delete_role(
            db=db,
            role_id=role_id,
        )

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete a role assigned to users.",
        )

    return None