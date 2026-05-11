import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image
import io
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import os
import cv2
import base64
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget
from pytorch_grad_cam.utils.image import show_cam_on_image

# New XAI Imports
import shap
from lime import lime_image
from skimage.segmentation import mark_boundaries

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        model = torch.load(MODEL_PATH, map_location=device, weights_only=False)
        model.eval()
        print("Model loaded successfully!")
        return True
    except Exception as e:
        print(f"Failed to load model: {e}")
        return False

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

@app.on_event("startup")
async def startup_event():
    load_model()

def get_lime_explanation(img_np, model, predicted_class):
    """Generates a LIME explanation for the image."""
    explainer = lime_image.LimeImageExplainer()
    
    def batch_predict(images):
        model.eval()
        batch = torch.stack([transform(Image.fromarray(i)) for i in images], dim=0).to(device)
        with torch.no_grad():
            logits = model(batch)
            probs = torch.nn.functional.softmax(logits, dim=1)
        return probs.detach().cpu().numpy()

    print("Generating LIME explanation...")
    explanation = explainer.explain_instance(
        img_np, 
        batch_predict, 
        top_labels=5, 
        hide_color=0, 
        num_samples=100 # Further reduced for speed
    )
    print("LIME explanation complete.")
    
    temp, mask = explanation.get_image_and_mask(
        predicted_class, 
        positive_only=True, 
        num_features=5, 
        hide_rest=False
    )
    img_boundaries = mark_boundaries(temp / 255.0, mask)
    return (img_boundaries * 255).astype(np.uint8), mask

def get_shap_explanation(input_tensor, model, predicted_class):
    """Final robust SHAP handler to prevent index and broadcasting errors."""
    model.eval()
    background = torch.zeros((1, 3, 224, 224)).to(device)
    explainer = shap.GradientExplainer(model, background)
    
    try:
        shap_values = explainer.shap_values(input_tensor)
        
        # 1. Determine which part of the output to use
        if isinstance(shap_values, list):
            # Format: [class_0_array, class_1_array, ...]
            # Safety check: if predicted_class is out of bounds, use the first one
            if predicted_class < len(shap_values):
                sv = shap_values[predicted_class]
            else:
                sv = shap_values[0]
        elif len(shap_values.shape) == 5:
            # Format: (batch, channels, h, w, classes)
            sv = shap_values[..., predicted_class]
        else:
            # Format: (batch, channels, h, w) - likely only one class output
            sv = shap_values

        # 2. Reduce to 2D Heatmap
        # sv is now (batch, channels, h, w) or (batch, h, w, channels)
        if sv.shape[1] == 3: # (batch, channels, h, w)
            shap_img = np.abs(sv[0]).mean(axis=0)
        else: # (batch, h, w, channels)
            shap_img = np.abs(sv[0]).mean(axis=-1)

        # 3. Final normalization and resize
        shap_img = cv2.resize(shap_img, (224, 224))
        shap_img = (shap_img - shap_img.min()) / (shap_img.max() - shap_img.min() + 1e-8)
        return shap_img
    except Exception as e:
        print(f"Internal SHAP error: {e}")
        # Return a blank mask instead of crashing
        return np.zeros((224, 224))

def encode_image(img_rgb):
    _, buffer = cv2.imencode('.jpg', cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR))
    return base64.b64encode(buffer).decode('utf-8')

@app.get("/")
def read_root():
    return {"status": "Backend is running", "model_loaded": model is not None}

@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    if model is None:
        if not load_model():
            raise HTTPException(status_code=500, detail="Model not loaded")

    try:
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data)).convert('RGB')
        img_224 = image.resize((224, 224))
        img_np = np.array(img_224)
        input_tensor = transform(image).unsqueeze(0).to(device)

        # 1. Inference
        with torch.no_grad():
            outputs = model(input_tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
            probs_array = probabilities.cpu().numpy()[0]
        
        predicted_class = int(np.argmax(probs_array))
        confidence = float(np.max(probs_array))

        # 2. XAI: Grad-CAM
        print("--- Starting Grad-CAM ---")
        heatmap_base64 = None
        gradcam_mask = None
        try:
            target_layers = [model.layer4[-1]]
            cam = GradCAM(model=model, target_layers=target_layers)
            grayscale_cam = cam(input_tensor=input_tensor, targets=None)[0, :]
            gradcam_mask = grayscale_cam
            img_float = np.float32(img_np) / 255
            visualization = show_cam_on_image(img_float, grayscale_cam, use_rgb=True)
            heatmap_base64 = encode_image(visualization)
            print("Grad-CAM finished.")
        except Exception as e: print(f"Grad-CAM error: {e}")

        # 3. XAI: LIME
        print("--- Starting LIME ---")
        lime_base64 = None
        lime_mask = None
        try:
            lime_viz, lime_mask = get_lime_explanation(img_np, model, predicted_class)
            lime_base64 = encode_image(lime_viz)
            print("LIME finished.")
        except Exception as e: print(f"LIME error: {e}")

        # 4. XAI: SHAP
        print("--- Starting SHAP ---")
        shap_base64 = None
        shap_mask = None
        try:
            shap_mask = get_shap_explanation(input_tensor, model, predicted_class)
            # Overlay SHAP heatmap
            shap_viz = show_cam_on_image(np.float32(img_np)/255, shap_mask, use_rgb=True)
            shap_base64 = encode_image(shap_viz)
            print("SHAP finished.")
        except Exception as e: print(f"SHAP error: {e}")

        # 5. Combined Interpretation Logic
        consensus_report = "Analysis complete."
        if gradcam_mask is not None and lime_mask is not None and shap_mask is not None:
            # Normalize masks to 0-1
            m1 = gradcam_mask
            m2 = cv2.resize(lime_mask.astype(float), (224, 224))
            m3 = shap_mask
            
            # Intersection of high-importance regions
            combined_mask = (m1 > 0.5) & (m2 > 0) & (m3 > 0.5)
            agreement_area = np.sum(combined_mask) / (224 * 224)
            
            if agreement_area > 0.05:
                consensus_report = "High Consensus: Grad-CAM, LIME, and SHAP all identify critical features in the same regions. Diagnostic confidence is high."
            elif agreement_area > 0.01:
                consensus_report = "Moderate Consensus: Multiple XAI methods overlap on key lesions. Further clinical review recommended."
            else:
                consensus_report = "Low Consensus: XAI methods highlight different areas. The model might be picking up subtle or dispersed patterns."

        return {
            "grade": predicted_class,
            "confidence": round(confidence * 100, 2),
            "probabilities": probs_array.tolist(),
            "explanations": {
                "gradcam": heatmap_base64,
                "lime": lime_base64,
                "shap": shap_base64
            },
            "interpretation": consensus_report
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
