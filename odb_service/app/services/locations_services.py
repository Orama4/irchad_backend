import requests
from app.config import settings

LOCATIONIQ_URL = "https://us1.locationiq.com/v1/reverse.php"

def get_location(lat: float, lon: float) -> str:
    """Fetch location details from LocationIQ API and return a clean string response."""
    params = {
        "key": settings.LOCATIONIQ_API_KEY,
        "lat": lat,
        "lon": lon,
        "format": "json"
    }
    response = requests.get(LOCATIONIQ_URL, params=params)

    if response.status_code == 200:
        data = response.json()
        location_str = (
            f" Location: {data.get('display_name', 'Unknown')}\n"
            f" Town: {data['address'].get('town', 'N/A')}\n"
            f" County: {data['address'].get('county', 'N/A')}\n"
            f" State: {data['address'].get('state', 'N/A')}\n"
            f" Country: {data['address'].get('country', 'N/A')}\n"
            f" Latitude: {lat}\n"
            f" Longitude: {lon}"
        )
        return location_str
    else:
        return " Error: Failed to fetch location details."
