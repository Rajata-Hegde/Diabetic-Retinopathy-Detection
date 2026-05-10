import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image
import io
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import os

app = FastAPI()

# Enable CORS so your React frontend can talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration - You will need to clone the model repo into this folder
MODEL_DIR = "ResNet50-APTOS-DR"
MODEL_PATH = os.path.join(MODEL_DIR, "diabetic_retinopathy_full_model.pth") 

model = None
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def load_model():
    global model
    if not os.path.exists(MODEL_PATH):
        print(f"ERROR: Model file not found at {MODEL_PATH}")
        return False
    
    try:
        # Based on your screenshot's loading logic
        # Adding weights_only=False because PyTorch 2.6+ defaults it to True
        model = torch.load(MODEL_PATH, map_location=device, weights_only=False)
        model.eval()
        print("Model loaded successfully!")
        return True
    except Exception as e:
        print(f"Failed to load model: {e}")
        return False

# Image preprocessing logic from your screenshot
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

@app.on_event("startup")
async def startup_event():
    load_model()

@app.get("/")
def read_root():
    return {"status": "Backend is running", "model_loaded": model is not None}

@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    if model is None:
        if not load_model():
            raise HTTPException(status_code=500, detail="Model not loaded on server. Check backend console.")

    try:
        # Read and preprocess image
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data)).convert('RGB')
        input_tensor = transform(image).unsqueeze(0).to(device)

        # Perform inference
        with torch.no_grad():
            outputs = model(input_tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
            probs_array = probabilities.cpu().numpy()[0]
        
        predicted_class = int(np.argmax(probs_array))
        confidence = float(np.max(probs_array))

        return {
            "grade": predicted_class,
            "confidence": round(confidence * 100, 2),
            "probabilities": probs_array.tolist()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
