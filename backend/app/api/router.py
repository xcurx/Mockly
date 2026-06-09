from fastapi import APIRouter
from app.api.interview import interview_router
from app.api.resume import resume_router

router = APIRouter()
router.include_router(interview_router, prefix="/interview", tags=["interview"])
router.include_router(resume_router, prefix="/resume", tags=["resume"])