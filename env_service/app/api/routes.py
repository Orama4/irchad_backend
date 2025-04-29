from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi import Depends
from app.services.prediction import handle_prediction
from app.models.loader import loaded_models
from sqlalchemy.orm import Session
from app.core.db import SessionLocal
from app.schemas.environement import EnvironmentCreate, EnvironmentOut
from app.services.environement import create_environment
from app.core.db import get_db   


router = APIRouter()

@router.get("/")
def root():
    available_models = [k for k, v in loaded_models.items() if v is not None]
    return {
        "message": "Multi-Model Detection API is running!",
        "available_models": available_models,
    }

@router.post("/predict/{model_id}/")
async def predict(model_id: str, file: UploadFile = File(...)):
    try:
        return await handle_prediction(model_id, file)
    except HTTPException as e:
        raise e


@router.post("/env/", response_model=EnvironmentOut)
def create_environment_route(env: EnvironmentCreate, db: Session = Depends(get_db)):
    return create_environment(db, env)