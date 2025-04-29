import os
from ultralytics import YOLO
from app.core.config import MODEL_CONFIG

loaded_models = {}


async def load_models():
    script_dir = os.path.dirname(__file__)
    base_dir = os.path.abspath(os.path.join(script_dir, "../../"))

    print("--- Loading models ---")
    for model_id, relative_path in MODEL_CONFIG.items():
        abs_path = os.path.join(base_dir, relative_path)
        print(f"Loading model '{model_id}' from: {abs_path}")
        if not os.path.exists(abs_path):
            print(f"  ERROR: File not found for '{model_id}' at {abs_path}")
            loaded_models[model_id] = None
            continue
        try:
            loaded_models[model_id] = YOLO(abs_path)
            print(f"  SUCCESS: Model '{model_id}' loaded.")
        except Exception as e:
            print(f"  ERROR: Failed to load '{model_id}'. Error: {e}")
            loaded_models[model_id] = None
    print("--- Model loading complete ---")
