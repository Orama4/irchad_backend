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
from app.services.environement import get_environment_by_id
from app.schemas.environement import EnvironmentUpdate
from app.services.environement import update_environment
from typing import List
from app.services.environement import get_all_environments
from app.services.environement import delete_environment




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


@router.get("/env/{env_id}", response_model=EnvironmentOut)
def read_environment(env_id: int, db: Session = Depends(get_db)):
    return get_environment_by_id(db, env_id)

@router.put("/env/{env_id}", response_model=EnvironmentOut)
def update_environment_route(env_id: int, update_data: EnvironmentUpdate, db: Session = Depends(get_db)):
    return update_environment(db, env_id, update_data)



@router.delete("/env/{env_id}")
def delete_environment_route(env_id: int, db: Session = Depends(get_db)):
    return delete_environment(db, env_id)



@router.get("/env/", response_model=List[EnvironmentOut])
def get_all_environments_route(db: Session = Depends(get_db)):
    return get_all_environments(db)