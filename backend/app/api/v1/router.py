from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.systems import router as systems_router
from app.api.v1.assessments import router as assessments_router
from app.api.v1.findings import router as findings_router
from app.api.v1.users import router as users_router
from app.api.v1.controls import router as controls_router
from app.api.v1.connectors import router as connectors_router
from app.api.v1.evidence import router as evidence_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.reports import router as reports_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(systems_router)
api_router.include_router(assessments_router)
api_router.include_router(findings_router)
api_router.include_router(users_router)
api_router.include_router(controls_router)
api_router.include_router(connectors_router)
api_router.include_router(evidence_router)
api_router.include_router(dashboard_router)
api_router.include_router(reports_router)
