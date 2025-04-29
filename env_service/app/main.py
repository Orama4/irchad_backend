from fastapi import FastAPI
from app.api.routes import router
from app.models.loader import load_models

app = FastAPI(title="YOLO Detection API")

@app.on_event("startup")
async def startup_event():
    await load_models()

app.include_router(router)
