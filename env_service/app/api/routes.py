from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse
from fastapi import Depends
from app.services.prediction import handle_prediction
from app.models.loader import loaded_models
from sqlalchemy.orm import Session
from app.core.db import SessionLocal
from app.schemas.environement import EnvironmentCreate, EnvironmentOut
from app.services.environement import create_environment, save_uploaded_file
from app.core.db import get_db   
from app.services.environement import get_environment_by_id
from app.schemas.environement import EnvironmentUpdate
from app.services.environement import update_environment
from typing import List
from app.services.environement import get_all_environments
from app.services.environement import delete_environment
import json




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
async def create_environment_route(
    file: UploadFile = File(...),
    env_data: str = Form(...),
    envID: str = None,
    db: Session = Depends(get_db)
):
    try:
        print(f"Received env_data: {env_data}")
        env_dict = json.loads(env_data)
        print(f"Parsed env_dict: {env_dict}")
        
        # Try to validate each field to pinpoint the issue
        try:
            env = EnvironmentCreate(**env_dict)
            print(f"Validation passed: {env}")
        except Exception as validation_error:
            print(f"Validation error: {validation_error}")
            raise HTTPException(status_code=422, detail=str(validation_error))
        
        file_path = await save_uploaded_file(file)
        if not env.pathCartographie:
            env.pathCartographie = file_path
        
        return update_environment(db, int(envID), env) if envID else create_environment(db=db, env=env)
    except json.JSONDecodeError as je:
        print(f"JSON Decode Error: {je}")
        raise HTTPException(status_code=400, detail="Invalid JSON in env_data")
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating environment: {str(e)}")
    
    
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