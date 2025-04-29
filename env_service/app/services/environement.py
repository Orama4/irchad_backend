from sqlalchemy.orm import Session
from app.core.models import Environment
from app.schemas.environement import EnvironmentCreate

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
