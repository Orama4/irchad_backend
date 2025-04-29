from sqlalchemy.orm import Session
from app.core.models import Environment
from app.schemas.environement import EnvironmentCreate
from app.schemas.environement import EnvironmentUpdate


def create_environment(db: Session, env: EnvironmentCreate):
    new_env = Environment(
        name=env.name,
        address=env.address,
        cords=env.cords,
        pathCartographie=env.pathCartographie,
        scale=env.scale
    )
    db.add(new_env)
    db.commit()
    db.refresh(new_env)
    return new_env

def get_environment_by_id(db: Session, env_id: int):
    env = db.query(Environment).filter(Environment.id == env_id).first()
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")
    return env

def update_environment(db: Session, env_id: int, update_data: EnvironmentUpdate):
    env = db.query(Environment).filter(Environment.id == env_id).first()
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")
    
    for field, value in update_data.dict(exclude_unset=True).items():
        setattr(env, field, value)
    
    db.commit()
    db.refresh(env)
    return env

def delete_environment(db: Session, env_id: int):
    env = db.query(Environment).filter(Environment.id == env_id).first()
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")
    
    db.delete(env)
    db.commit()
    return {"message": f"Environment with id {env_id} has been deleted"}

def get_all_environments(db: Session):
    return db.query(Environment).all()
