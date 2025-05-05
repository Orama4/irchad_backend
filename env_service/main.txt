import fastapi
from fastapi.responses import JSONResponse
from ultralytics import YOLO
from ultralytics.engine.results import Results  # For type hinting raw results
from PIL import Image
import io
import os
from typing import Dict, List  # For type hinting

from geojson import Feature, Polygon, FeatureCollection

app = fastapi.FastAPI()

# --- Model Loading and Startup (remains the same) ---
MODEL_CONFIG = {
    "floorplan_detector": "./models/floorplan_detection_best.pt",
}
loaded_models: Dict[str, YOLO] = {}


@app.on_event("startup")
async def load_models():
    script_dir = os.path.dirname(__file__)
    print("--- Loading models ---")
    for model_id, relative_path in MODEL_CONFIG.items():
        abs_model_path = os.path.join(script_dir, relative_path)
        print(f"Attempting to load model '{model_id}' from: {abs_model_path}")
        if not os.path.exists(abs_model_path):
            print(f"  ERROR: Model file not found for '{model_id}' at {abs_model_path}")
            loaded_models[model_id] = None
        else:
            try:
                loaded_models[model_id] = YOLO(abs_model_path)
                print(f"  SUCCESS: Model '{model_id}' loaded.")
            except Exception as e:
                print(f"  ERROR: Failed to load model '{model_id}'. Error: {e}")
                loaded_models[model_id] = None
    print("--- Model loading complete ---")


# --- Helper Function: Run Prediction ---
def run_model_prediction(model: YOLO, image: Image.Image) -> List[Results]:
    """Runs the YOLO model prediction on the Pillow image."""
    try:
        # You might want to adjust prediction parameters here if needed
        # e.g., model.predict(image, conf=0.25, iou=0.7)
        results = model.predict(image)
        return results
    except Exception as e:
        # Log the error appropriately in a real app
        print(f"ERROR during model prediction: {e}")
        # Re-raise or handle as needed; here we let the endpoint handle it
        raise fastapi.HTTPException(
            status_code=500, detail=f"Model prediction failed. Error: {e}"
        )


# --- Helper Function: Convert to GeoJSON ---
def convert_results_to_geojson(
    results: List[Results],
    img_width: int,
    img_height: int,
    filename: str,
    model_id: str,
) -> FeatureCollection:
    """Converts raw YOLO prediction results to a GeoJSON FeatureCollection."""
    features = []

    # Add Image Boundary Feature
    features.append(
        Feature(
            geometry=Polygon(
                [
                    [
                        [0, 0],
                        [img_width, 0],
                        [img_width, img_height],
                        [0, img_height],
                        [0, 0],
                    ]
                ]
            ),
            properties={
                "type": "ImageBoundary",
                "width": img_width,
                "height": img_height,
                "filename": filename,
                "model_used": model_id,
            },
        )
    )

    # Process detections if results are valid
    if not results or len(results) == 0:
        print("Warning: No results returned from model.")
        return FeatureCollection(features)  # Return boundary only if no detections

    # Assuming results[0] contains the relevant data for the single image
    result = results[0]
    # Check if Boxes object exists and is not None
    if result.boxes is None:
        print("Warning: Results object does not contain boxes.")
        return FeatureCollection(features)

    # Safely get data, providing defaults if attributes are missing (good practice)
    boxes = getattr(result.boxes, "xyxy", None)
    classes = getattr(result.boxes, "cls", None)
    confidences = getattr(result.boxes, "conf", None)
    class_names = getattr(result, "names", {})  # Use getattr for names too

    # Ensure all necessary components are present
    if boxes is None or classes is None or confidences is None:
        print("Warning: Missing boxes, classes, or confidences in results.")
        return FeatureCollection(features)

    # Convert to lists (if they are tensors)
    boxes_list = boxes.cpu().tolist()
    classes_list = classes.cpu().tolist()
    confidences_list = confidences.cpu().tolist()

    for box, cls_id, conf in zip(boxes_list, classes_list, confidences_list):
        x1, y1, x2, y2 = box
        class_name = class_names.get(int(cls_id), "Unknown")

        polygon_geometry = Polygon(
            [
                [
                    [float(x1), float(y1)],
                    [float(x2), float(y1)],
                    [float(x2), float(y2)],
                    [float(x1), float(y2)],
                    [float(x1), float(y1)],
                ]
            ]
        )

        feature = Feature(
            geometry=polygon_geometry,
            properties={
                "class_id": int(cls_id),
                "class_name": class_name,
                "confidence": float(conf),
                "x1": float(x1),
                "y1": float(y1),
                "x2": float(x2),
                "y2": float(y2),
            },
        )
        features.append(feature)

    return FeatureCollection(features)


# --- Root Endpoint (remains the same) ---
@app.get("/")
def read_root():
    available_models = [
        mid for mid, model in loaded_models.items() if model is not None
    ]
    return {
        "message": "Multi-Model Detection API is running!",
        "available_models": available_models,
    }


# --- Refactored Prediction Endpoint ---
@app.post("/predict/{model_id}/")
async def predict_with_model(
    model_id: str, file: fastapi.UploadFile = fastapi.File(...)
):  # Remove the return type hint
    # 1. Select Model
    model = loaded_models.get(model_id)
    if model is None:
        if model_id not in MODEL_CONFIG:
            raise fastapi.HTTPException(
                status_code=404, detail=f"Model ID '{model_id}' not found."
            )
        else:
            raise fastapi.HTTPException(
                status_code=503,
                detail=f"Model '{model_id}' is not available (failed to load).",
            )

    # 2. Read and Open Image
    contents = await file.read()
    try:
        image = Image.open(io.BytesIO(contents))
        img_width, img_height = image.size
    except Exception as e:
        raise fastapi.HTTPException(
            status_code=400, detail=f"Could not open or read image file. Error: {e}"
        )

    # 3. Run Prediction (using helper function)
    raw_results = run_model_prediction(model, image)

    # 4. Convert to GeoJSON
    geojson_output = convert_results_to_geojson(
        results=raw_results,
        img_width=img_width,
        img_height=img_height,
        filename=file.filename,
        model_id=model_id,
    )

    # 5. Return GeoJSON as a JSONResponse
    return JSONResponse(content=geojson_output)
