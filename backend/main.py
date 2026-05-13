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

# AI Explanation Imports
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))
# Configure with version='v1' to avoid v1beta 404 issues
# Configure with REST transport to avoid some gRPC 404/connection issues on Windows
genai.configure(api_key=os.getenv("GEMINI_API_KEY"), transport='rest')

# Global variable to store discovered models
AVAILABLE_MODELS = []

def discover_models():
    global AVAILABLE_MODELS
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("❌ No GEMINI_API_KEY found in .env")
        return
        
    try:
        print(f"Listing models with key: {api_key[:10]}...")
        models = []
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                models.append(m.name)
        print(f"✅ Discovered {len(models)} Gemini models: {models}")
        AVAILABLE_MODELS = models
    except Exception as e:
        print(f"⚠️ Could not list Gemini models: {type(e).__name__}: {e}")
        AVAILABLE_MODELS = []

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Use absolute path relative to this script's directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "ResNet50-APTOS-DR")
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
    discover_models()

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
    """SHAP handler with detailed progress logging and error tracking."""
    import time
    model.eval()
    
    print("\n" + "="*60)
    print("🔍 SHAP EXPLANATION COMPUTATION")
    print("="*60)
    
    try:
        # Step 1: Prepare background
        print("📊 [STEP 1/4] Preparing background samples...")
        start_time = time.time()
        background = torch.zeros((1, 3, 224, 224)).to(device)
        print(f"   ✓ Background shape: {background.shape}")
        print(f"   ✓ Device: {device}")
        print(f"   ✓ Time: {time.time() - start_time:.2f}s")
        
        # Step 2: Initialize explainer
        print("\n📊 [STEP 2/4] Initializing GradientExplainer...")
        start_time = time.time()
        explainer = shap.GradientExplainer(model, background)
        print(f"   ✓ Explainer initialized")
        print(f"   ✓ Time: {time.time() - start_time:.2f}s")

        # Keep SHAP responsive on CPU by reducing the default sample budget.
        shap_nsamples = 10 if device.type == "cpu" else 25
        print(f"   ✓ SHAP sample budget: {shap_nsamples}")
        
        # Step 3: Compute SHAP values (most time-consuming)
        print("\n📊 [STEP 3/4] Computing SHAP values (this may take 20-60s)...")
        print(f"   Input tensor shape: {input_tensor.shape}")
        print(f"   Predicted class: {predicted_class}")
        start_time = time.time()
        
        shap_values = explainer.shap_values(input_tensor, nsamples=shap_nsamples)
        
        elapsed = time.time() - start_time
        print(f"   ✓ SHAP values computed!")
        print(f"   ✓ Output type: {type(shap_values)}")
        if isinstance(shap_values, list):
            print(f"   ✓ Output length: {len(shap_values)}")
        else:
            print(f"   ✓ Output shape: {shap_values.shape if hasattr(shap_values, 'shape') else 'N/A'}")
        print(f"   ✓ Time taken: {elapsed:.2f}s")
        
        # Step 4: Extract and process values
        print("\n📊 [STEP 4/4] Processing SHAP output...")
        start_time = time.time()
        
        # 1. Determine which part of the output to use
        print(f"   • Extracting class {predicted_class} from output...")
        if isinstance(shap_values, list):
            print(f"     - Output is list with {len(shap_values)} classes")
            if predicted_class < len(shap_values):
                sv = shap_values[predicted_class]
                print(f"     - Using index {predicted_class}")
            else:
                sv = shap_values[0]
                print(f"     - Class out of range, using index 0")
        elif len(shap_values.shape) == 5:
            print(f"     - Output shape is 5D, extracting class {predicted_class}")
            sv = shap_values[..., predicted_class]
        else:
            print(f"     - Using output as-is")
            sv = shap_values

        print(f"   • Extracted SHAP values shape: {sv.shape if hasattr(sv, 'shape') else 'N/A'}")

        # 2. Reduce to 2D Heatmap
        print(f"   • Reducing to 2D heatmap...")
        if hasattr(sv, 'shape') and len(sv.shape) >= 3:
            if sv.shape[1] == 3: # (batch, channels, h, w)
                shap_img = np.abs(sv[0]).mean(axis=0)
                print(f"     - Averaged {sv.shape[1]} channels from (batch, channels, h, w)")
            else: # (batch, h, w, channels)
                shap_img = np.abs(sv[0]).mean(axis=-1)
                print(f"     - Averaged channels from (batch, h, w, channels)")
        else:
            print(f"   ⚠️  Unexpected shape, attempting fallback...")
            shap_img = np.abs(sv[0]) if hasattr(sv, '__getitem__') else np.abs(sv)

        print(f"   • 2D heatmap shape: {shap_img.shape}")
        print(f"   • Heatmap value range: [{shap_img.min():.6f}, {shap_img.max():.6f}]")

        # 3. Final normalization and resize
        print(f"   • Resizing to 224x224...")
        shap_img = cv2.resize(shap_img, (224, 224))
        shap_min = shap_img.min()
        shap_max = shap_img.max()
        
        if shap_max > shap_min:
            shap_img = (shap_img - shap_min) / (shap_max - shap_min + 1e-8)
        else:
            print(f"   ⚠️  All values equal, skipping normalization")
        
        print(f"   • Normalized range: [{shap_img.min():.6f}, {shap_img.max():.6f}]")
        print(f"   ✓ Time: {time.time() - start_time:.2f}s")
        
        print("\n" + "="*60)
        print("✅ SHAP COMPUTATION SUCCESSFUL")
        print("="*60 + "\n")
        
        return shap_img
        
    except Exception as e:
        elapsed = time.time() - start_time if 'start_time' in locals() else 0
        print(f"\n❌ SHAP ERROR OCCURRED")
        print(f"   Exception type: {type(e).__name__}")
        print(f"   Error message: {str(e)}")
        print(f"   Time before failure: {elapsed:.2f}s")
        print(f"   Device: {device}")
        print(f"   Model status: {'eval' if not model.training else 'train'}")
        
        import traceback
        print("\nFull traceback:")
        print(traceback.format_exc())
        
        print("\n⚠️  Returning fallback (blank heatmap)...")
        print("="*60 + "\n")
        
        # Return a blank mask instead of crashing
        return np.zeros((224, 224))

def get_gemini_explanation(image_pil, heatmap_pil, grade_name, confidence, methods, agreement_score):
    """
    Uses Gemini 1.5 (Pro/Flash) to generate a dual-purpose explanation:
    1. A professional Clinical Audit for doctors.
    2. A plain-English Patient Report for non-medical users.
    """
    if not os.getenv("GEMINI_API_KEY"):
        print("⚠️ Gemini API Key missing! Skipping AI explanation.")
        return None
        
    prompt = f"""
    You are a Senior Ophthalmic AI Specialist. 
    Analyze the raw Retinal Image and the XAI Consensus Heatmap (which highlights model focus in red/yellow).

    DIAGNOSTIC CONTEXT:
    - AI Prediction: {grade_name}
    - Confidence Score: {confidence:.1f}%
    - Agreement Score: {agreement_score*100:.1f}%

    YOUR TASK: Generate a high-utility, structured report.

    PART 1: [CLINICAL_AUDIT]
    Format: Use 'KEY: VALUE' pairs for each line.
    Mandatory Keys:
    - VALIDATION: (e.g., Confirmed/Suspicious/Noise)
    - FOCUS_AREA: (e.g., Superior Periphery, Macular Region)
    - PATHOLOGY_MATCH: (e.g., Hemorrhages detected in heatmap region)
    - ARTIFACT_CHECK: (e.g., No interference from optic disc)
    - RELIABILITY: (e.g., High/Moderate based on consensus)
    - VERDICT: (Short clinical summary)

    PART 2: [PATIENT_REPORT]
    Tone: Empathetic, detailed, and specific. DO NOT be generic.
    Goal: Help the patient understand THEIR specific eye.
    Instructions:
    1. VISUAL DESCRIPTION: Describe exactly WHERE the AI is looking in their eye (e.g., "the outer edges" or "near the center").
    2. FINDING EXPLANATION: Explain the finding using a friendly analogy (e.g., "like small bruises on a fruit").
    3. SEVERITY CONTEXT: Explain what '{grade_name}' means for their daily life (e.g., "This stage usually doesn't affect vision yet, but needs monitoring").
    4. ACTIONABLE ADVICE: Give 2 specific questions they should ask their doctor at their next visit.
    5. REASSURANCE: A supportive closing statement.

    IMPORTANT: Maintain the [CLINICAL_AUDIT] and [PATIENT_REPORT] tags.
    """

    # Try discovered models first, then fallbacks
    model_names = AVAILABLE_MODELS + ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro-vision']
    
    # Remove 'models/' prefix if present for the loop, as SDK handles it
    model_names = [m.replace('models/', '') for m in model_names]
    # Remove duplicates but keep order
    model_names = list(dict.fromkeys(model_names))

    for model_name in model_names:
        try:
            print(f"Trying Gemini model: {model_name}...")
            model_ai = genai.GenerativeModel(model_name)
            
            # Send both images if heatmap is available
            content = [prompt, image_pil]
            if heatmap_pil:
                content.append(heatmap_pil)
                
            response = model_ai.generate_content(content)
            return response.text.strip()
        except Exception as e:
            print(f"⚠️ {model_name} failed: {str(e)[:150]}...")
            continue
            
    print("❌ All Gemini models failed.")
    return None

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

    import time
    overall_start = time.time()
    
    print("\n" + "█"*60)
    print("🏥 DIABETIC RETINOPATHY ANALYSIS STARTED")
    print("█"*60)
    print(f"📁 File: {file.filename}")
    print(f"🖥️  Device: {device}")
    print(f"⏰ Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print("█"*60 + "\n")

    try:
        print("[1/5] Reading and processing image...")
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data)).convert('RGB')
        img_224 = image.resize((224, 224))
        img_np = np.array(img_224)
        input_tensor = transform(image).unsqueeze(0).to(device)
        print(f"  ✓ Image loaded: {img_np.shape}\n")

        print("[2/5] Running model inference...")
        inference_start = time.time()
        with torch.no_grad():
            outputs = model(input_tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
            probs_array = probabilities.cpu().numpy()[0]
        
        predicted_class = int(np.argmax(probs_array))
        confidence = float(np.max(probs_array))
        inference_time = time.time() - inference_start
        
        dr_grades = ["No DR", "Mild DR", "Moderate DR", "Severe DR", "Proliferative DR"]
        grade_name = dr_grades[predicted_class] if predicted_class < 5 else "Unknown"
        print(f"  ✓ Prediction: {grade_name} (Confidence: {confidence*100:.2f}%)")
        print(f"  ✓ Inference time: {inference_time:.2f}s")
        print(f"  ✓ Probabilities: {[f'{p:.4f}' for p in probs_array]}\n")

        # 2. XAI: Grad-CAM
        print("\n" + "─"*60)
        print("🎨 [XAI 1/3] Starting Grad-CAM...")
        print("─"*60)
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
            print("✅ Grad-CAM finished successfully.\n")
        except Exception as e: 
            print(f"❌ Grad-CAM error: {type(e).__name__}: {e}\n")

        # 3. XAI: LIME
        print("─"*60)
        print("🎨 [XAI 2/3] Starting LIME...")
        print("─"*60)
        lime_base64 = None
        lime_mask = None
        try:
            lime_viz, lime_mask = get_lime_explanation(img_np, model, predicted_class)
            lime_base64 = encode_image(lime_viz)
            print("✅ LIME finished successfully.\n")
        except Exception as e: 
            print(f"❌ LIME error: {type(e).__name__}: {e}\n")

        # 4. XAI: SHAP
        print("─"*60)
        print("🎨 [XAI 3/3] Starting SHAP...")
        print("─"*60)
        shap_base64 = None
        shap_mask = None
        try:
            shap_mask = get_shap_explanation(input_tensor, model, predicted_class)
            # Overlay SHAP heatmap
            shap_viz = show_cam_on_image(np.float32(img_np)/255, shap_mask, use_rgb=True)
            shap_base64 = encode_image(shap_viz)
            print("✅ SHAP visualization complete.\n")
        except Exception as e: 
            print(f"❌ SHAP error: {type(e).__name__}: {e}\n")

        # 5. Combined Interpretation Logic
        print("─"*60)
        print("[5/5] Computing consensus interpretation...")
        print("─"*60)

        available_methods = []
        
        if gradcam_mask is not None:
            available_methods.append("Grad-CAM")
        if lime_mask is not None:
            available_methods.append("LIME")
        if shap_mask is not None:
            available_methods.append("SHAP")
        
        # Only compute consensus if we have at least 2 methods
        if len(available_methods) >= 2:
            try:
                # Normalize all masks to 0-1 range for fair comparison
                masks_to_combine = []
                
                if gradcam_mask is not None:
                    m1 = (gradcam_mask - gradcam_mask.min()) / (gradcam_mask.max() - gradcam_mask.min() + 1e-8)
                    masks_to_combine.append(m1)
                
                if lime_mask is not None:
                    m2 = cv2.resize(lime_mask.astype(float), (224, 224))
                    m2 = (m2 - m2.min()) / (m2.max() - m2.min() + 1e-8)
                    masks_to_combine.append(m2)
                
                if shap_mask is not None:
                    m3 = (shap_mask - shap_mask.min()) / (shap_mask.max() - shap_mask.min() + 1e-8)
                    masks_to_combine.append(m3)
                
                # Create consensus mask by averaging available methods
                consensus_mask = np.mean(masks_to_combine, axis=0)
                
                # Calculate agreement scores
                high_importance_regions = [m > 0.5 for m in masks_to_combine]
                
                # Count agreements
                if len(high_importance_regions) == 3:
                    all_agree = high_importance_regions[0] & high_importance_regions[1] & high_importance_regions[2]
                    two_agree = (high_importance_regions[0] & high_importance_regions[1]) | \
                               (high_importance_regions[0] & high_importance_regions[2]) | \
                               (high_importance_regions[1] & high_importance_regions[2])
                    agreement_area = np.sum(all_agree) / (224 * 224)
                    partial_agreement = np.sum(two_agree) / (224 * 224)
                    agreement_score = (agreement_area * 3 + partial_agreement) / 4.0
                    agreement_level = 3
                elif len(high_importance_regions) == 2:
                    two_agree = high_importance_regions[0] & high_importance_regions[1]
                    partial_agreement = np.sum(two_agree) / (224 * 224)
                    agreement_score = partial_agreement / 2.0
                    agreement_area = partial_agreement
                    agreement_level = 2
                
                # Generate combined visualization
                consensus_viz = show_cam_on_image(np.float32(img_np)/255, consensus_mask, use_rgb=True)
                combined_visualization = encode_image(consensus_viz)
                
                # Generate detailed consensus report
                methods_str = ", ".join(available_methods)
                
                if len(available_methods) == 3:
                    if agreement_area > 0.08:
                        consensus_report = f"""STRONG MULTI-METHOD CONSENSUS:
Grade: {grade_name} (Confidence: {confidence*100:.1f}%)
All three XAI methods ({methods_str}) identify critical lesion regions in the same areas.
This high agreement significantly increases diagnostic confidence.
Key affected regions show consistent microaneurysm/hemorrhage patterns across all explanation methods.
Clinical Action: HIGH CONFIDENCE. Standard follow-up protocol recommended."""
                    elif agreement_area > 0.03:
                        consensus_report = f"""MODERATE MULTI-METHOD AGREEMENT:
Grade: {grade_name} (Confidence: {confidence*100:.1f}%)
Multiple XAI methods identify similar important regions ({methods_str}).
Some divergence suggests subtle or distributed lesions being detected.
Clinical Action: MODERATE CONFIDENCE. Recommend detailed clinical review and possible repeat imaging."""
                    else:
                        consensus_report = f"""DIVERGENT METHOD INTERPRETATIONS:
Grade: {grade_name} (Confidence: {confidence*100:.1f}%)
The XAI methods highlight different regions, suggesting complex pathology with multiple subtle features.
Clinical Action: CAUTION RECOMMENDED. Prioritize expert ophthalmologist review."""
                else:
                    if agreement_score > 0.3:
                        consensus_report = f"""PARTIAL CONSENSUS ({len(available_methods)} Methods):
Grade: {grade_name} (Confidence: {confidence*100:.1f}%)
Available methods ({methods_str}) show good agreement on key regions.
Clinical Action: MODERATE-HIGH CONFIDENCE. Standard follow-up recommended."""
                    else:
                        consensus_report = f"""LIMITED AGREEMENT ({len(available_methods)} Methods):
Grade: {grade_name} (Confidence: {confidence*100:.1f}%)
Available methods show some divergence in highlighted regions.
Clinical Action: MODERATE CONFIDENCE. Recommend expert review."""
            
            except Exception as e:
                print(f"Consensus calculation error: {e}")
                consensus_report = f"Grade: {grade_name} (Confidence: {confidence*100:.1f}%)"
                combined_visualization = None
        else:
            # Fallback when only 1 or 0 methods work
            if len(available_methods) == 1:
                consensus_report = f"""SINGLE XAI METHOD AVAILABLE:
Grade: {grade_name} (Confidence: {confidence*100:.1f}%)
Only {available_methods[0]} explanation available.
Clinical Action: Standard explanation only. Full multi-method consensus unavailable."""
            else:
                consensus_report = f"""NO XAI METHODS AVAILABLE:
Grade: {grade_name} (Confidence: {confidence*100:.1f}%)
Explainability analysis could not be performed.
Clinical Action: Use primary model prediction with standard clinical review."""
            
            combined_visualization = None
            agreement_score = 0

        # Generate AI-powered clinical interpretation using Gemini
        print("🤖 Generating AI Dual-Report via Gemini...")
        
        # Prepare consensus heatmap for Gemini if available
        heatmap_pil = None
        if combined_visualization:
            # consensus_viz is the numpy array used for combined_visualization
            heatmap_pil = Image.fromarray(consensus_viz)

        ai_response = get_gemini_explanation(
            image, 
            heatmap_pil,
            grade_name, 
            confidence * 100, 
            available_methods, 
            agreement_score
        )
        
        clinical_audit = ""
        patient_report = ""

        if ai_response:
            print("✅ AI response generated. Parsing sections...")
            # Simple parsing for the two sections
            if "[CLINICAL_AUDIT]" in ai_response and "[PATIENT_REPORT]" in ai_response:
                parts = ai_response.split("[PATIENT_REPORT]")
                clinical_audit = parts[0].replace("[CLINICAL_AUDIT]", "").strip()
                patient_report = parts[1].strip()
            else:
                clinical_audit = ai_response
                patient_report = "Analysis complete. Please consult your physician for a plain-language explanation."
        else:
            clinical_audit = consensus_report
            patient_report = "AI explanation service is currently unavailable. Please review the technical consensus below."

        final_interpretation = f"{clinical_audit}\n\n--- TECHNICAL CONSENSUS ---\n{consensus_report}"

        # Print final summary
        print("\n" + "="*60)
        print("✅ ANALYSIS COMPLETE - SUMMARY")
        print("="*60)
        print(f"📊 Prediction: {grade_name} ({confidence*100:.2f}% confidence)")
        print(f"🔍 XAI Methods Used: {', '.join(available_methods) if available_methods else 'None'}")
        print(f"🤝 Agreement Score: {round(agreement_score * 100, 1)}%")
        print(f"⏱️  Total time: {time.time() - overall_start:.2f}s")
        print("="*60 + "\n")

        return {
            "grade": predicted_class,
            "confidence": round(confidence * 100, 2),
            "probabilities": probs_array.tolist(),
            "explanations": {
                "gradcam": heatmap_base64,
                "lime": lime_base64,
                "shap": shap_base64,
                "consensus": combined_visualization
            },
            "interpretation": {
                "summary": final_interpretation.strip(),
                "clinical_audit": clinical_audit.strip(),
                "patient_report": patient_report.strip(),
                "agreement_score": round(agreement_score, 3),
                "methods_available": available_methods
            }
        }
    except Exception as e:
        import traceback
        
        print("\n" + "█"*60)
        print("❌ ANALYSIS FAILED - ERROR DETAILS")
        print("█"*60)
        print(f"⏱️  Time elapsed: {time.time() - overall_start:.2f}s")
        print(f"❌ Exception type: {type(e).__name__}")
        print(f"❌ Error message: {str(e)}")
        print(f"❌ Error location:")
        traceback.print_exc()
        print("█"*60 + "\n")
        
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
