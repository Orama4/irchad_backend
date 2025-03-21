from fastapi import APIRouter
from .routes.admin import router as admin_router

# Create a global router to include all individual routes
router = APIRouter()

router.include_router(admin_router, prefix="/admin", tags=["Home"])
