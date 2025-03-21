from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.api.routes.admin import router as admin_router
from app.mqtt_client import start_mqtt

app = FastAPI()

# Démarrer MQTT
start_mqtt()

# Monter les fichiers statiques
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Inclure les routes FastAPI
app.include_router(admin_router, prefix="/admin", tags=["Admin"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
