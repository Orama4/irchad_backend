import os
from ultralytics import YOLO
from app.core.config import MODEL_CONFIG

loaded_models = {}

async def load_models():
    script_dir = os.path.dirname(__file__)
    base_dir = os.path.abspath(os.path.join(script_dir, "../../"))
    
    # Print debug info
    print("\n--- DEBUG INFO ---")
    print(f"Script directory: {script_dir}")
    print(f"Base directory: {base_dir}")
    print(f"MODEL_CONFIG: {MODEL_CONFIG}")
    print("--- END DEBUG ---\n")
    
    print("--- Loading models ---")
    for model_id, relative_path in MODEL_CONFIG.items():
        # Normalize the path separators
        normalized_path = os.path.normpath(relative_path)
        
        # Construct absolute path correctly
        abs_path = os.path.join(base_dir, normalized_path)
        abs_path = os.path.normpath(abs_path)  # Normalize again to ensure consistent separators
        
        print(f"Loading model '{model_id}' from: {abs_path}")
        
        # Check if file exists
        if not os.path.exists(abs_path):
            print(f"  ERROR: File not found for '{model_id}' at {abs_path}")
            
            # Try an alternative path
            alt_path = os.path.join(script_dir, os.path.basename(relative_path))
            alt_path = os.path.normpath(alt_path)
            print(f"  Trying alternative path directly in app/models: {alt_path}")
            
            if os.path.exists(alt_path):
                print(f"  Found model at alternative path: {alt_path}")
                abs_path = alt_path
            else:
                print(f"  Model not found at alternative path either")
                loaded_models[model_id] = None
                continue
                
        try:
            print(f"  Attempting to load model from: {abs_path}")
            loaded_models[model_id] = YOLO(abs_path)
            print(f"  SUCCESS: Model '{model_id}' loaded.")
        except Exception as e:
            print(f"  ERROR: Failed to load '{model_id}'. Error: {e}")
            loaded_models[model_id] = None
    
    print("--- Model loading complete ---")
    print(f"Successfully loaded models: {[k for k, v in loaded_models.items() if v is not None]}")
