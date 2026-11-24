import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.core.exceptions import AppException


logger = logging.getLogger(__name__)


async def app_exception_handler(
    request: Request,
    exc: AppException,
):
    logger.warning(
        "Application error: %s | Path: %s",
        exc.message,
        request.url.path,
    )

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.message,
            "details": exc.details,
        },
    )


async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
):
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "message": "Request validation failed",
            "details": exc.errors(),
        },
    )


async def general_exception_handler(
    request: Request,
    exc: Exception,
):
    logger.exception(
        "Unexpected error occurred: %s",
        request.url.path,
    )

    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error",
            "details": None,
        },
    )


def register_exception_handlers(app: FastAPI):

    app.add_exception_handler(
        AppException,
        app_exception_handler,
    )

    app.add_exception_handler(
        RequestValidationError,
        validation_exception_handler,
    )

    app.add_exception_handler(
        Exception,
        general_exception_handler,
    )