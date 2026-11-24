from fastapi import APIRouter, Depends

from app.core.permissions import (
    require_admin,
    require_analyst,
    require_viewer,
)


router = APIRouter(
    prefix="/permissions",
    tags=["Role-Based Access Control"],
)


# ==========================================
# ADMIN ONLY
# ==========================================

@router.get("/admin")
def admin_dashboard(
    current_user=Depends(require_admin),
):

    return {
        "message": "Welcome to Admin Dashboard",
        "user_id": current_user.id,
        "role": "Admin",
        "access": "Full Access",
    }


# ==========================================
# ADMIN + ANALYST
# ==========================================

@router.get("/analyst")
def analyst_dashboard(
    current_user=Depends(require_analyst),
):

    return {
        "message": "Welcome to Analytics Dashboard",
        "user_id": current_user.id,
        "role": "Admin or Analyst",
        "access": "Analytics Access",
    }


# ==========================================
# ALL AUTHENTICATED ROLES
# ==========================================

@router.get("/viewer")
def viewer_dashboard(
    current_user=Depends(require_viewer),
):

    return {
        "message": "Welcome to Data Copilot Dashboard",
        "user_id": current_user.id,
        "role": current_user.role_id,
        "access": "Read Access",
    }