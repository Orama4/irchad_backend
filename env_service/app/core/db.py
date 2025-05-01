import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from contextlib import contextmanager
from dotenv import load_dotenv

load_dotenv()  # Charge les variables du .env

# Récupère l'URL de la base de données depuis le fichier .env
DATABASE_URL = os.getenv("DATABASE_URL")

# Crée l'engine SQLAlchemy
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# Crée la sessionmaker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Fonction pour obtenir une session DB

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Déclare la base pour les modèles
Base = declarative_base()
