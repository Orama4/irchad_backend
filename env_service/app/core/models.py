from sqlalchemy import Column, Integer, String, JSON, DateTime
from datetime import datetime
from app.core.db import Base

class Environment(Base):
    __tablename__ = "Environment"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    address = Column(String(255), nullable=False)
    cords = Column(JSON, nullable=True)
    pathCartographie = Column(String(255), nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    scale = Column(Integer, nullable=True)
