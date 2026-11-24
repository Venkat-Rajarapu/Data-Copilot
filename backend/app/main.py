from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.error_handlers import register_exception_handlers
from app.core.logging_config import configure_logging


# ==========================================
# LOGGING CONFIGURATION
# ==========================================

configure_logging()


# ==========================================
# APPLICATION LIFESPAN
# ==========================================

@asynccontextmanager
async def lifespan(app: FastAPI):

    print(f"Starting {settings.APP_NAME}")

    yield

    print("Shutting down application")


# ==========================================
# FASTAPI APPLICATION
# ==========================================

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-Powered Business Analytics and Decision Intelligence Platform",
    version="1.0.0",
    debug=settings.DEBUG,
    lifespan=lifespan,
)


# ==========================================
# CORS CONFIGURATION
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# EXCEPTION HANDLERS
# ==========================================

register_exception_handlers(app)


# ==========================================
# API ROUTER REGISTRATION
# ==========================================

app.include_router(
    api_router,
    prefix=settings.API_V1_PREFIX,
)


# ==========================================
# ROOT ENDPOINT
# ==========================================

@app.get("/", tags=["Root"])
async def root():

    return {
        "message": "Data Copilot API is running",
        "application": settings.APP_NAME,
        "version": "1.0.0",
        "status": "success",
    }