from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.db.dependencies import get_db
from app.api.dependencies import get_current_user

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
)

from app.schemas.auth import (
    LoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    AccessTokenResponse,
    AuthenticatedUser,
)

from database.repositories import user_repository


# ==========================================
# AUTHENTICATION ROUTER
# ==========================================

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


# ==========================================
# 1. LOGIN API
# ==========================================

@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
)
def login(
    credentials: LoginRequest,
    db: Session = Depends(get_db),
):
    """
    Authenticate user using email and password.
    Generate access and refresh tokens.
    """

    # Authenticate user
    user = user_repository.authenticate_user(
        db=db,
        email=str(credentials.email),
        password=credentials.password,
    )

    # Check credentials
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check account status
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is inactive.",
        )

    # Prepare JWT payload
    token_data = {
        "sub": str(user.id),
    }

    # Generate tokens
    access_token = create_access_token(
        data=token_data,
    )

    refresh_token = create_refresh_token(
        data=token_data,
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
    )


# ==========================================
# 2. REFRESH TOKEN API
# ==========================================

@router.post(
    "/refresh",
    response_model=AccessTokenResponse,
    status_code=status.HTTP_200_OK,
)
def refresh_access_token(
    request: RefreshTokenRequest,
    db: Session = Depends(get_db),
):
    """
    Generate a new access token using
    a valid refresh token.
    """

    # Validate refresh token
    payload = decode_token(
        token=request.refresh_token,
        expected_type="refresh",
    )

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
        )

    # Extract user ID
    try:
        user_id = int(payload["sub"])

    except (KeyError, TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token payload.",
        )

    # Retrieve user
    user = user_repository.get_user_by_id(
        db=db,
        user_id=user_id,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found.",
        )

    # Check account status
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is inactive.",
        )

    # Generate new access token
    new_access_token = create_access_token(
        data={
            "sub": str(user.id),
        },
    )

    return AccessTokenResponse(
        access_token=new_access_token,
        token_type="bearer",
    )


# ==========================================
# 3. CURRENT LOGGED-IN USER API
# ==========================================

@router.get(
    "/me",
    response_model=AuthenticatedUser,
    status_code=status.HTTP_200_OK,
)
def get_logged_in_user(
    current_user=Depends(get_current_user),
):
    """
    Return details of the currently
    authenticated user.
    """

    return current_user