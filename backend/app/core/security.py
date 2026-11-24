from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from pwdlib import PasswordHash

from app.core.config import settings


# ==========================================
# PASSWORD HASHING CONFIGURATION
# ==========================================

password_hash = PasswordHash.recommended()


# ==========================================
# JWT CONFIGURATION
# ==========================================

ALGORITHM = "HS256"


# ==========================================
# PASSWORD HASHING
# ==========================================

def hash_password(password: str) -> str:
    """
    Hash a plain-text password using Argon2.
    """
    return password_hash.hash(password)


# ==========================================
# PASSWORD VERIFICATION
# ==========================================

def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    """
    Verify a plain-text password against its hash.
    """
    return password_hash.verify(
        plain_password,
        hashed_password
    )


# ==========================================
# GENERATE JWT TOKEN
# ==========================================

def create_token(
    data: dict[str, Any],
    expires_delta: timedelta,
    token_type: str
) -> str:
    """
    Generate a signed JWT token.
    """

    now = datetime.now(timezone.utc)

    payload = data.copy()

    payload.update({
        "iat": now,
        "exp": now + expires_delta,
        "type": token_type
    })

    encoded_token = jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=ALGORITHM
    )

    return encoded_token


# ==========================================
# GENERATE ACCESS TOKEN
# ==========================================

def create_access_token(
    data: dict[str, Any]
) -> str:
    """
    Generate a short-lived access token.
    """

    expires_delta = timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    return create_token(
        data=data,
        expires_delta=expires_delta,
        token_type="access"
    )


# ==========================================
# GENERATE REFRESH TOKEN
# ==========================================

def create_refresh_token(
    data: dict[str, Any]
) -> str:
    """
    Generate a long-lived refresh token.
    """

    expires_delta = timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )

    return create_token(
        data=data,
        expires_delta=expires_delta,
        token_type="refresh"
    )


# ==========================================
# VERIFY AND DECODE JWT TOKEN
# ==========================================

def decode_token(
    token: str,
    expected_type: str | None = None
) -> dict[str, Any] | None:
    """
    Verify JWT signature, expiration and token type.

    Returns decoded payload if valid.
    Returns None if invalid or expired.
    """

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[ALGORITHM],
            options={
                "require": ["exp", "iat", "sub", "type"]
            }
        )

        if expected_type is not None:
            if payload.get("type") != expected_type:
                return None

        return payload

    except jwt.InvalidTokenError:
        return None