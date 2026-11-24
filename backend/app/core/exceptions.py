from typing import Any


class AppException(Exception):
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        details: Any = None,
    ):
        self.message = message
        self.status_code = status_code
        self.details = details

        super().__init__(message)


class ResourceNotFoundException(AppException):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(
            message=message,
            status_code=404,
        )


class BadRequestException(AppException):
    def __init__(self, message: str = "Bad request"):
        super().__init__(
            message=message,
            status_code=400,
        )


class UnauthorizedException(AppException):
    def __init__(self, message: str = "Unauthorized access"):
        super().__init__(
            message=message,
            status_code=401,
        )


class ForbiddenException(AppException):
    def __init__(self, message: str = "Access forbidden"):
        super().__init__(
            message=message,
            status_code=403,
        )


class ConflictException(AppException):
    def __init__(self, message: str = "Resource conflict"):
        super().__init__(
            message=message,
            status_code=409,
        )