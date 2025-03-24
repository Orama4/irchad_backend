from fastapi import APIRouter
from pydantic import BaseModel
from app.services.locations_services import get_location



router = APIRouter()

# Define request model for incoming JSON data
class LocationRequest(BaseModel):
    lat: float
    lon: float

@router.post("/location", summary="Get Location Details via POST")
def fetch_location(request: LocationRequest) -> str:
    """API that takes latitude & longitude and returns a formatted location string."""
    return get_location(request.lat, request.lon)
