from fastapi import APIRouter
from app.api.interview import interview_router

router = APIRouter()
router.include_router(interview_router, prefix="/interview", tags=["interview"])