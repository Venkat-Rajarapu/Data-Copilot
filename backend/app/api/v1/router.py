from fastapi import APIRouter

from app.api.v1.endpoints import (
    health,
    roles,
    users,
    datasets,
    auth,
    permissions,
    data_quality,
    data_cleaning,
    data_processing,
    dataset_history,
)


api_router = APIRouter()


api_router.include_router(health.router)

api_router.include_router(roles.router)

api_router.include_router(users.router)

api_router.include_router(datasets.router)

api_router.include_router(auth.router)

api_router.include_router(permissions.router)

api_router.include_router(data_quality.router)

api_router.include_router(data_cleaning.router)

api_router.include_router(data_processing.router)

api_router.include_router(dataset_history.router)