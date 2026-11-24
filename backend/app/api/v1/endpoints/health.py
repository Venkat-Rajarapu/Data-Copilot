from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.dependencies import get_db


# ==========================================
# HEALTH ROUTER
# ==========================================

router = APIRouter(
    prefix="/health",
    tags=["Health"]
)


# ==========================================
# 1. APPLICATION HEALTH CHECK
# ==========================================

@router.get("/")
def health_check():
    """
    Check whether the application is running.
    """

    return {
        "status": "success",
        "application": "Data Copilot",
        "message": "Data Copilot API is running."
    }


# ==========================================
# 2. API PING CHECK
# ==========================================

@router.get("/ping")
def ping():
    """
    Simple API response check.
    """

    return {
        "status": "success",
        "message": "pong",
        "application": "Data Copilot"
    }


# ==========================================
# 3. DATABASE HEALTH CHECK
# ==========================================

@router.get("/database")
def database_health_check(
    db: Session = Depends(get_db)
):
    """
    Check PostgreSQL database connectivity.
    """

    try:

        db.execute(text("SELECT 1"))

        return {
            "status": "success",
            "application": "Data Copilot",
            "database": "connected",
            "message": "PostgreSQL connection is working."
        }

    except Exception:

        return {
            "status": "error",
            "application": "Data Copilot",
            "database": "disconnected",
            "message": "Unable to connect to PostgreSQL."
        }