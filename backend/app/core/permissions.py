from fastapi import Depends, HTTPException, status

from app.api.dependencies import get_current_user


# ==========================================
# ROLE DEFINITIONS
# ==========================================

ROLE_ADMIN = 1
ROLE_ANALYST = 2
ROLE_VIEWER = 3


# ==========================================
# ROLE PERMISSION CHECKER
# ==========================================

def require_roles(*allowed_roles: int):

    def role_checker(
        current_user=Depends(get_current_user),
    ):

        if current_user.role_id not in allowed_roles:

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource.",
            )

        return current_user

    return role_checker


# ==========================================
# ROLE-SPECIFIC DEPENDENCIES
# ==========================================

require_admin = require_roles(ROLE_ADMIN)

require_analyst = require_roles(
    ROLE_ADMIN,
    ROLE_ANALYST,
)

require_viewer = require_roles(
    ROLE_ADMIN,
    ROLE_ANALYST,
    ROLE_VIEWER,
)