from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.systems import router as systems_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(systems_router)
