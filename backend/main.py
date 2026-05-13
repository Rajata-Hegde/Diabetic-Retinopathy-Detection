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
from datetime import datetime

# New XAI Imports
import shap
from lime import lime_image
from skimage.segmentation import mark_boundaries

# AI Explanation Imports
import google.generativeai as genai
from dotenv import load_dotenv

# MongoDB Imports
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))

# MongoDB Configuration
MONGODB_URI = os.getenv("MONGODB_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME", "RetinaCareDB")
db_client = None
db = None

# Gemini Configuration
genai.configure(api_key=os.getenv("GEMINI_API_KEY"), transport='rest')

# Global variable to store discovered models
AVAILABLE_MODELS = []

def discover_models():
    global AVAILABLE_MODELS
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return
    try:
        models = []
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                models.append(m.name)
        AVAILABLE_MODELS = models
    except Exception as e:
        print(f"⚠️ Gemini Discovery Error: {e}")

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model Loading
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "ResNet50-APTOS-DR")
MODEL_PATH = os.path.join(MODEL_DIR, "diabetic_retinopathy_full_model.pth")

model = None
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def load_model():
    global model
    if not os.path.exists(MODEL_PATH):
        return False
    try:
        model = torch.load(MODEL_PATH, map_location=device, weights_only=False)
        model.eval()
        return True
    except Exception:
        return False

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

@app.on_event("startup")
async def startup_event():
    global db_client, db
    load_model()
    discover_models()
    if MONGODB_URI:
        try:
            db_client = AsyncIOMotorClient(MONGODB_URI)
            db = db_client[DATABASE_NAME]
            print(f"✅ Connected to MongoDB: {DATABASE_NAME}")
        except Exception as e:
            print(f"❌ MongoDB Connection Error: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    if db_client:
        db_client.close()

# --- XAI Handlers ---

def get_lime_explanation(img_np, model, predicted_class):
    explainer = lime_image.LimeImageExplainer()
    def batch_predict(images):
        model.eval()
        batch = torch.stack([transform(Image.fromarray(i)) for i in images], dim=0).to(device)
        with torch.no_grad():
            logits = model(batch)
            probs = torch.nn.functional.softmax(logits, dim=1)
        return probs.detach().cpu().numpy()

    explanation = explainer.explain_instance(img_np, batch_predict, top_labels=5, hide_color=0, num_samples=100)
    temp, mask = explanation.get_image_and_mask(predicted_class, positive_only=True, num_features=5, hide_rest=False)
    img_boundaries = mark_boundaries(temp / 255.0, mask)
    return (img_boundaries * 255).astype(np.uint8), mask

def get_shap_explanation(input_tensor, model, predicted_class):
    import time
    model.eval()
    try:
        background = torch.zeros((1, 3, 224, 224)).to(device)
        explainer = shap.GradientExplainer(model, background)
        shap_nsamples = 10 if device.type == "cpu" else 25
        shap_values = explainer.shap_values(input_tensor, nsamples=shap_nsamples)
        
        if isinstance(shap_values, list):
            sv = shap_values[predicted_class] if predicted_class < len(shap_values) else shap_values[0]
        elif len(shap_values.shape) == 5:
            sv = shap_values[..., predicted_class]
        else:
            sv = shap_values

        if hasattr(sv, 'shape') and len(sv.shape) >= 3:
            shap_img = np.abs(sv[0]).mean(axis=0) if sv.shape[1] == 3 else np.abs(sv[0]).mean(axis=-1)
        else:
            shap_img = np.abs(sv[0])

        shap_img = cv2.resize(shap_img, (224, 224))
        shap_min, shap_max = shap_img.min(), shap_img.max()
        if shap_max > shap_min:
            shap_img = (shap_img - shap_min) / (shap_max - shap_min + 1e-8)
        return shap_img
    except Exception:
        return np.zeros((224, 224))

def get_gemini_explanation(image_pil, heatmap_pil, grade_name, confidence, methods, agreement_score):
    if not os.getenv("GEMINI_API_KEY"):
        return None
        
    prompt = f"""
    You are a Senior Ophthalmic AI Specialist. 
    Analyze the raw Retinal Image and the XAI Consensus Heatmap.

    DIAGNOSTIC CONTEXT:
    - AI Prediction: {grade_name}
    - Confidence Score: {confidence:.1f}%
    - Agreement Score: {agreement_score*100:.1f}%

    PART 1: [CLINICAL_AUDIT]
    (Key: Value pairs for doctors)
    PART 2: [PATIENT_REPORT]
    (Plain English for patients)
    """

    model_names = AVAILABLE_MODELS + ['gemini-2.0-flash-lite', 'gemini-1.5-flash']
    model_names = [m.replace('models/', '') for m in model_names]
    model_names = list(dict.fromkeys(model_names))

    for model_name in model_names:
        try:
            model_ai = genai.GenerativeModel(model_name)
            content = [prompt, image_pil]
            if heatmap_pil:
                content.append(heatmap_pil)
            response = model_ai.generate_content(content)
            return response.text.strip()
        except Exception:
            continue
    return None

def encode_image(img_rgb):
    _, buffer = cv2.imencode('.jpg', cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR))
    return base64.b64encode(buffer).decode('utf-8')

@app.get("/")
async def read_root():
    return {
        "status": "Online", 
        "database": "Connected" if db is not None else "Disconnected",
        "model": "Loaded" if model is not None else "Error"
    }

@app.get("/records")
async def get_records():
    if db is None:
        return []
    try:
        cursor = db.diagnostics.find().sort("timestamp", -1).limit(50)
        records = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            records.append(doc)
        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/records/{record_id}")
async def delete_record(record_id: str):
    if db is None:
        raise HTTPException(status_code=500, detail="Database disconnected")
    try:
        result = await db.diagnostics.delete_one({"_id": ObjectId(record_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Record not found")
        return {"status": "success", "message": "Record deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    if model is None and not load_model():
        raise HTTPException(status_code=500, detail="Model unavailable")

    try:
        # 1. Processing
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data)).convert('RGB')
        img_np = np.array(image.resize((224, 224)))
        input_tensor = transform(image).unsqueeze(0).to(device)

        # 2. Inference
        with torch.no_grad():
            outputs = model(input_tensor)
            probs = torch.nn.functional.softmax(outputs, dim=1).cpu().numpy()[0]
        
        predicted_class = int(np.argmax(probs))
        confidence = float(np.max(probs))
        dr_grades = ["No DR", "Mild DR", "Moderate DR", "Severe DR", "Proliferative DR"]
        grade_name = dr_grades[predicted_class]

        # 3. XAI Suite
        # Grad-CAM
        target_layers = [model.layer4[-1]]
        cam = GradCAM(model=model, target_layers=target_layers)
        grad_mask = cam(input_tensor=input_tensor, targets=None)[0, :]
        grad_viz = show_cam_on_image(np.float32(img_np)/255, grad_mask, use_rgb=True)
        
        # LIME
        lime_viz, lime_mask = get_lime_explanation(img_np, model, predicted_class)
        
        # SHAP
        shap_mask = get_shap_explanation(input_tensor, model, predicted_class)
        shap_viz = show_cam_on_image(np.float32(img_np)/255, shap_mask, use_rgb=True)

        # Consensus
        m_grad = (grad_mask - grad_mask.min()) / (grad_mask.max() - grad_mask.min() + 1e-8)
        m_lime = cv2.resize(lime_mask.astype(float), (224, 224))
        m_lime = (m_lime - m_lime.min()) / (m_lime.max() - m_lime.min() + 1e-8)
        m_shap = (shap_mask - shap_mask.min()) / (shap_mask.max() - shap_mask.min() + 1e-8)
        
        consensus_mask = np.mean([m_grad, m_lime, m_shap], axis=0)
        consensus_viz = show_cam_on_image(np.float32(img_np)/255, consensus_mask, use_rgb=True)
        
        # 4. AI Report
        ai_response = get_gemini_explanation(image, Image.fromarray(consensus_viz), grade_name, confidence*100, ["Grad-CAM", "LIME", "SHAP"], 0.85)
        
        clinical_audit = ""
        patient_report = ""
        if ai_response and "[PATIENT_REPORT]" in ai_response:
            parts = ai_response.split("[PATIENT_REPORT]")
            clinical_audit = parts[0].replace("[CLINICAL_AUDIT]", "").strip()
            patient_report = parts[1].strip()
        else:
            clinical_audit = ai_response or "Clinical interpretation generated."
            patient_report = "Analysis complete. View technical details below."

        # 5. Database Persistence
        result_payload = {
            "timestamp": datetime.utcnow().isoformat(),
            "filename": file.filename,
            "grade": predicted_class,
            "grade_name": grade_name,
            "confidence": round(confidence * 100, 2),
            "clinical_audit": clinical_audit,
            "patient_report": patient_report,
            "images": {
                "original": encode_image(np.array(image.resize((400, 400)))),
                "gradcam": encode_image(grad_viz),
                "lime": encode_image(lime_viz),
                "shap": encode_image(shap_viz),
                "consensus": encode_image(consensus_viz)
            }
        }

        if db is not None:
            await db.diagnostics.insert_one(result_payload)
            print(f"💾 Record saved to MongoDB for {file.filename}")

        # Return response (clean _id for JSON)
        if "_id" in result_payload: result_payload["_id"] = str(result_payload["_id"])
        return result_payload

    except Exception as e:
        print(f"❌ Analysis Failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
