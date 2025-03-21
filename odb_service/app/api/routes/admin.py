from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates
from app.mqtt_client import send_mqtt_message, latest_message
import logging
from app.utils.shared_state import shared_state

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

@router.get("/")
def index(request: Request):
    return templates.TemplateResponse("admin.html", {"request": request})

@router.get("/request")
def request_system_info():
    send_mqtt_message()
    return {"message": "Requête envoyée"}

import json

@router.get("/status")
def get_status():
    if shared_state.latest_message:
        return shared_state.latest_message
    else:
        return {"message": "⏳ Données non encore disponibles"}
