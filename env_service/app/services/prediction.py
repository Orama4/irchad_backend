from fastapi import UploadFile, HTTPException
from fastapi.responses import JSONResponse
from PIL import Image
from ultralytics.engine.results import Results
from ultralytics import YOLO
from geojson import Feature, Polygon, FeatureCollection
import io
from typing import List, Dict
from app.models.loader import loaded_models
import fastapi


def run_model_prediction(model: YOLO, image: Image.Image) -> List[Results]:
    """Runs the YOLO model prediction on the Pillow image."""
    try:
        results = model.predict(image)
        return results
    except Exception as e:
        print(f"ERROR during model prediction: {e}")
        raise HTTPException(
            status_code=500, detail=f"Model prediction failed. Error: {e}"
        )


def convert_results_to_geojson(
    results: List[Results],
    img_width: int,
    img_height: int,
    filename: str,
    model_id: str,
) -> FeatureCollection:
    """Converts raw YOLO prediction results to a GeoJSON FeatureCollection."""
    features = []

    # Add image boundary
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

    if not results or len(results) == 0 or results[0].boxes is None:
        return FeatureCollection(features)

    result = results[0]
    boxes = getattr(result.boxes, "xyxy", None)
    classes = getattr(result.boxes, "cls", None)
    confidences = getattr(result.boxes, "conf", None)
    class_names = getattr(result, "names", {})

    if boxes is None or classes is None or confidences is None:
        return FeatureCollection(features)

    boxes_list = boxes.cpu().tolist()
    classes_list = classes.cpu().tolist()
    confidences_list = confidences.cpu().tolist()

    for box, cls_id, conf in zip(boxes_list, classes_list, confidences_list):
        x1, y1, x2, y2 = box
        class_name = class_names.get(int(cls_id), "Unknown")

        feature = Feature(
            geometry=Polygon(
                [
                    [
                        [float(x1), float(y1)],
                        [float(x2), float(y1)],
                        [float(x2), float(y2)],
                        [float(x1), float(y2)],
                        [float(x1), float(y1)],
                    ]
                ]
            ),
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


async def handle_prediction(model_id: str, file: UploadFile):
    model = loaded_models.get(model_id)

    if model is None:
        raise HTTPException(
            status_code=503 if model_id in loaded_models else 404,
            detail=f"Model '{model_id}' is not available or not found."
        )

    contents = await file.read()
    try:
        image = Image.open(io.BytesIO(contents))
        img_width, img_height = image.size
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Could not open image. Error: {e}"
        )

    results = run_model_prediction(model, image)

    geojson_output = convert_results_to_geojson(
        results=results,
        img_width=img_width,
        img_height=img_height,
        filename=file.filename,
        model_id=model_id,
    )

    return JSONResponse(content=geojson_output)
