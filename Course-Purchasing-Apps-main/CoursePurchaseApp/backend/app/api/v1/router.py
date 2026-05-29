from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.courses import router as courses_router
from app.api.v1.payments import router as payments_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth_router)
api_router.include_router(courses_router)
api_router.include_router(payments_router)
