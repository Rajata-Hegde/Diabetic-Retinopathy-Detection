import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image
import io
import asyncio
import threading
import json
import re
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import os
import base64
from uuid import uuid4
from datetime import datetime

# Optional heavy dependencies: import with fallbacks so the demo runs without them
HAS_CV2 = False
HAS_PYTORCH_GRAD_CAM = False
HAS_SHAP = False
HAS_LIME = False
HAS_DOTENV = False
HAS_MOTOR = False
HAS_GENAI = False

try:
    import cv2
    HAS_CV2 = True
except Exception:
    cv2 = None

try:
    from pytorch_grad_cam import GradCAM
    from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget
    from pytorch_grad_cam.utils.image import show_cam_on_image
    HAS_PYTORCH_GRAD_CAM = True
except Exception:
    # fallback lightweight GradCAM stub
    class GradCAM:
        def __init__(self, model=None, target_layers=None):
            pass
        def __call__(self, input_tensor=None, targets=None):
            b = 1
            h = 224
            w = 224
            return np.ones((b, h, w))
    def show_cam_on_image(img, mask, use_rgb=True):
        try:
            arr = np.array(img).astype(np.uint8)
            m = np.array(mask)
            if m.ndim == 3:
                m = m[0]
            m = (m - m.min()) / (m.max() - m.min() + 1e-8)
            mask_resized = (m * 255).astype(np.uint8)
            mask_rgb = np.stack([mask_resized, np.zeros_like(mask_resized), np.zeros_like(mask_resized)], axis=-1)
            overlay = (0.6 * arr + 0.4 * mask_rgb).astype(np.uint8)
            return overlay
        except Exception:
            return np.array(img)

try:
    import shap
    HAS_SHAP = True
except Exception:
    shap = None

try:
    from lime import lime_image
    from skimage.segmentation import mark_boundaries
    HAS_LIME = True
except Exception:
    lime_image = None
    def mark_boundaries(a, b):
        return a

try:
    from dotenv import load_dotenv
    HAS_DOTENV = True
except Exception:
    def load_dotenv(*args, **kwargs):
        return

try:
    import google.generativeai as genai
    HAS_GENAI = True
except Exception:
    genai = None

try:
    from motor.motor_asyncio import AsyncIOMotorClient
    from bson import ObjectId
    HAS_MOTOR = True
except Exception:
    AsyncIOMotorClient = None
    ObjectId = None
try:
    from retrieval import retrieve
    HAS_RETRIEVAL = True
except Exception:
    HAS_RETRIEVAL = False

try:
    import certifi
    HAS_CERTIFI = True
except Exception:
    HAS_CERTIFI = False

try:
    import dns.resolver
    HAS_DNS = True
except Exception:
    HAS_DNS = False

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import Column, String, Integer, Float, Text, Boolean, JSON, DateTime, select, delete
from sqlalchemy.dialects.postgresql import JSONB

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)

engine = create_async_engine(DATABASE_URL) if DATABASE_URL else None
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False) if engine else None
Base = declarative_base()

class DiagnosticRecord(Base):
    __tablename__ = "diagnostics"
    id = Column(String, primary_key=True)
    filename = Column(String)
    timestamp = Column(String)
    grade = Column(Integer)
    grade_name = Column(String)
    confidence = Column(Float)
    clinical_audit = Column(Text)
    patient_report = Column(Text)
    xai_agreement = Column(Float)
    vlm_alignment = Column(String)
    review_required = Column(Boolean)
    review_risk = Column(String)
    review_reason = Column(Text)
    images = Column(JSONB)
    suggestions = Column(JSONB)
    sources = Column(JSONB)

# Gemini Configuration
if os.getenv("GEMINI_API_KEY"):
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"), transport='rest')
AVAILABLE_MODELS = []

# In-memory staged analysis cache
ANALYSIS_JOBS = {}
ANALYSIS_LOCK = threading.Lock()
ANALYSIS_TTL_SECONDS = 3600
LOW_CONFIDENCE_THRESHOLD = 65.0
LOW_XAI_AGREEMENT_THRESHOLD = 0.35
DR_GRADES = ["No DR", "Mild DR", "Moderate DR", "Severe DR", "Proliferative DR"]

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
    load_model()
    discover_models()
    if engine:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("✅ PostgreSQL Tables Created")

@app.on_event("shutdown")
async def shutdown_event():
    if engine:
        await engine.dispose()

# --- XAI Handlers ---

def get_lime_explanation(img_np, model, predicted_class):
    # If LIME isn't available, return a simple highlighted mask
    if not HAS_LIME or lime_image is None:
        h, w = img_np.shape[0], img_np.shape[1]
        mask = np.zeros((h, w), dtype=np.uint8)
        # crude center blob
        cy, cx = h // 2, w // 2
        ry, rx = h // 6, w // 6
        y, x = np.ogrid[:h, :w]
        mask_region = ((y - cy) ** 2) / (ry * ry) + ((x - cx) ** 2) / (rx * rx) <= 1
        mask[mask_region] = 1
        return (img_np * 0.8).astype(np.uint8), mask

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
    # If shap isn't available, return a blank map
    if not HAS_SHAP or shap is None:
        return np.zeros((224, 224))

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

        if HAS_CV2 and cv2 is not None:
            shap_img = cv2.resize(shap_img, (224, 224))
        else:
            shap_img = np.array(Image.fromarray((shap_img * 255).astype(np.uint8)).resize((224,224))).astype(float)/255.0

        shap_min, shap_max = shap_img.min(), shap_img.max()
        if shap_max > shap_min:
            shap_img = (shap_img - shap_min) / (shap_max - shap_min + 1e-8)
        return shap_img
    except Exception:
        return np.zeros((224, 224))

def _extract_json_object(text):
    if not text:
        return None
    cleaned = text.strip()
    try:
        return json.loads(cleaned)
    except Exception:
        pass

    block_match = re.search(r"```(?:json)?\s*(\{[\s\S]*\})\s*```", cleaned, re.IGNORECASE)
    if block_match:
        try:
            return json.loads(block_match.group(1))
        except Exception:
            pass

    brace_match = re.search(r"(\{[\s\S]*\})", cleaned)
    if brace_match:
        try:
            return json.loads(brace_match.group(1))
        except Exception:
            return None
    return None

def _parse_vlm_grade_hint(text):
    if not text:
        return None
    t = text.lower()
    if "proliferative" in t:
        return 4
    if "severe" in t:
        return 3
    if "moderate" in t:
        return 2
    if "mild" in t:
        return 1
    if "no dr" in t or "no diabetic retinopathy" in t or "normal" in t:
        return 0
    return None

def _compute_xai_agreement(m_grad, m_lime, m_shap):
    # Binary overlap agreement across three explainers.
    b_grad = m_grad > 0.5
    b_lime = m_lime > 0.5
    b_shap = m_shap > 0.5

    def iou(a, b):
        inter = np.logical_and(a, b).sum()
        union = np.logical_or(a, b).sum()
        return float(inter / (union + 1e-8))

    pairwise = [iou(b_grad, b_lime), iou(b_grad, b_shap), iou(b_lime, b_shap)]
    return float(np.mean(pairwise))

def _build_guardrail_assessment(predicted_class, confidence_pct, vlm_grade_hint, alignment, xai_agreement):
    reasons = []
    contradiction = False

    if confidence_pct < LOW_CONFIDENCE_THRESHOLD:
        reasons.append("Low classifier confidence")

    if xai_agreement < LOW_XAI_AGREEMENT_THRESHOLD:
        reasons.append("Low explainer agreement")

    if alignment == "low":
        reasons.append("VLM self-reported low evidence alignment")

    if vlm_grade_hint is not None and abs(vlm_grade_hint - predicted_class) >= 2:
        contradiction = True
        reasons.append("VLM-classifier grade contradiction")

    review_required = len(reasons) > 0
    if contradiction or confidence_pct < 50:
        risk = "high"
    elif review_required:
        risk = "medium"
    else:
        risk = "low"

    return {
        "review_required": review_required,
        "review_risk": risk,
        "review_reason": "; ".join(reasons) if reasons else "No major reliability flags",
        "model_vlm_contradiction": contradiction,
    }

def get_gemini_explanation(image_pil, heatmap_pil, grade_name, confidence, methods, agreement_score, xai_text=None):
    # If Gemini isn't configured or the gemini client isn't available, return a deterministic fallback
    if not os.getenv("GEMINI_API_KEY") or not HAS_GENAI:
        # Minimal, conservative, non-hallucinating explanation generator
        gn = grade_name.lower()
        findings = []
        vlm_hint = "Unknown"
        alignment = "medium"
        if "no dr" in gn or "no diabetic" in gn or "normal" in gn:
            findings = ["No clear signs of diabetic retinopathy on the fundus image."]
            vlm_hint = "No DR"
            alignment = "high"
        elif "mild" in gn:
            findings = ["Few microaneurysms suggested by the model; no extensive hemorrhages noted."]
            vlm_hint = "Mild DR"
            alignment = "medium"
        elif "moderate" in gn:
            findings = ["Moderate-level microvascular changes suggested; consider specialist review."]
            vlm_hint = "Moderate DR"
            alignment = "medium"
        elif "severe" in gn or "proliferative" in gn:
            findings = ["Extensive retinal hemorrhages or exudates suspected; urgent ophthalmic referral recommended."]
            vlm_hint = "Severe DR"
            alignment = "low"
        else:
            findings = ["Model indicates possible retinal changes; specialist review advised."]

        clinical_audit = "\n".join([f"- {f}" for f in findings])
        patient_report = "".join([f for f in findings])

        out = {
            "clinical_audit": clinical_audit,
            "patient_report": patient_report,
            "evidence_alignment": alignment,
            "vlm_grade_hint": _parse_vlm_grade_hint(vlm_hint),
        }
        # attach retrieved sources if available
        if HAS_RETRIEVAL:
            try:
                q = f"Guidance for {grade_name}"
                retrieved = retrieve(q, k=2)
                if retrieved:
                    out['sources'] = [{ 'id': r.get('id'), 'title': r.get('title'), 'url': r.get('url'), 'score': r.get('score') } for r in retrieved]
                    out['suggestions'] = [f"Review guidance: {retrieved[0].get('title')} ({retrieved[0].get('url')})", 'Document findings and notify care team.']
            except Exception:
                out['suggestions'] = ['Specialist ophthalmology review recommended.']
        else:
            out['suggestions'] = ['Specialist ophthalmology review recommended.']

        return out

    prompt = f"""
    You are a Senior Ophthalmic AI Specialist working under strict hallucination controls.
    Analyze the retinal image first, then analyze the provided XAI consensus heatmap to cross-check findings.

    DIAGNOSTIC CONTEXT:
    - AI Prediction: {grade_name}
    - Confidence Score: {confidence:.1f}%
    - Agreement Score: {agreement_score*100:.1f}%
    - XAI Methods: {", ".join(methods)}
    - XAI Summary: {xai_text or 'N/A'}

    HARD CONSTRAINTS:
    1) Use only findings visible in the image or supported by the heatmap.
    2) Never invent patient demographics, history, treatment plan, or lab values.
    3) If uncertain, say "Insufficient visual evidence".
    4) Keep patient summary <= 80 words.

    Return strict JSON only with this schema:
    {{
      "clinical_findings": ["bullet 1", "bullet 2", "bullet 3"],
      "patient_summary": "plain language summary",
      "uncertainty_note": "where uncertainty exists",
      "evidence_alignment": "high|medium|low",
      "vlm_grade_hint": "No DR|Mild DR|Moderate DR|Severe DR|Proliferative DR|Unknown"
    }}
    """

    model_names = AVAILABLE_MODELS + ['gemini-2.0-flash-lite', 'gemini-1.5-flash']
    model_names = [m.replace('models/', '') for m in model_names]
    model_names = list(dict.fromkeys(model_names))

    for model_name in model_names:
        try:
            model_ai = genai.GenerativeModel(model_name)
            content = [prompt, image_pil]
            # Provide the original image first, then the heatmap, then the xai summary
            if heatmap_pil:
                content.append(heatmap_pil)
            if xai_text:
                content.append(xai_text)

            # Retrieve authoritative snippets when retriever is available
            retrieved = []
            if HAS_RETRIEVAL:
                try:
                    q = f"Find clinical guidance about diabetic retinopathy related to: {grade_name}. Context: {xai_text or ''}"
                    retrieved = retrieve(q, k=3)
                    # append retrieved snippets as plain text with citation tags
                    for r in retrieved:
                        snippet = r.get('text', '')[:800]
                        content.append(f"[CITED:{r.get('id')}] {r.get('title')} - {r.get('url')}\n{snippet}")
                except Exception:
                    retrieved = []

            response = model_ai.generate_content(content)
            raw_text = response.text.strip()
            parsed = _extract_json_object(raw_text)
            # If parsing failed, attempt a small corrective retry asking model to return strict JSON only
            retry_attempts = 0
            while parsed is None and retry_attempts < 2:
                try:
                    fix_prompt = (
                        "The previous assistant output failed to produce valid JSON. "
                        "Here is the original output:\n\n" + raw_text + "\n\n"
                        "Please return ONLY a valid JSON object that matches the schema provided earlier and nothing else. "
                    )
                    fix_resp = model_ai.generate_content([fix_prompt])
                    raw_text = fix_resp.text.strip()
                    parsed = _extract_json_object(raw_text)
                except Exception:
                    parsed = None
                retry_attempts += 1

            if parsed:
                findings = parsed.get("clinical_findings")
                clinical_audit = ""
                if isinstance(findings, list):
                    clinical_audit = "\n".join([f"- {str(x)}" for x in findings if str(x).strip()])
                else:
                    clinical_audit = str(findings or "").strip()

                patient_report = str(parsed.get("patient_summary") or "").strip()
                uncertainty_note = str(parsed.get("uncertainty_note") or "").strip()
                evidence_alignment = str(parsed.get("evidence_alignment") or "unknown").strip().lower()
                vlm_grade_hint_text = str(parsed.get("vlm_grade_hint") or "").strip()

                if uncertainty_note:
                    clinical_audit = (clinical_audit + "\n" if clinical_audit else "") + f"- Uncertainty: {uncertainty_note}"

                out = {
                    "clinical_audit": clinical_audit or "Clinical interpretation generated.",
                    "patient_report": patient_report or "Analysis complete. View technical details below.",
                    "evidence_alignment": evidence_alignment,
                    "vlm_grade_hint": _parse_vlm_grade_hint(vlm_grade_hint_text),
                }

                # Build RAG-grounded suggestions for next steps
                try:
                    suggestions = []
                    # simple rule-based suggestions using grade hint, alignment, and agreement score
                    vh = parsed.get('vlm_grade_hint') if isinstance(parsed.get('vlm_grade_hint'), str) else ''
                    gh = _parse_vlm_grade_hint(vh)
                    if gh is None:
                        if 'severe' in grade_name.lower() or 'proliferative' in grade_name.lower():
                            suggestions.append('Urgent ophthalmology referral for suspected severe/proliferative DR.')
                        else:
                            suggestions.append('Specialist ophthalmology review recommended to confirm findings.')
                    else:
                        if gh >= 3:
                            suggestions.append('Urgent ophthalmology referral for possible sight-threatening retinopathy.')
                        elif gh == 2:
                            suggestions.append('Refer to ophthalmology for evaluation and treatment planning.')
                        elif gh == 1:
                            suggestions.append('Schedule routine ophthalmology follow-up within recommended timeframe.')
                        else:
                            suggestions.append('Continue routine diabetic eye screening schedule; no immediate referral indicated.')

                    if evidence_alignment == 'low' or agreement_score < LOW_XAI_AGREEMENT_THRESHOLD:
                        suggestions.append('Obtain repeat or higher-quality imaging (wide-field or OCT) to clarify uncertain findings.')

                    if retrieved:
                        top = retrieved[0]
                        suggestions.append(f"Review guidance: {top.get('title')} ({top.get('url')})")

                    suggestions.append('Document findings in the EHR and notify the care team.')
                    out['suggestions'] = suggestions
                except Exception:
                    out['suggestions'] = []

                if retrieved:
                    out['sources'] = [{ 'id': r.get('id'), 'title': r.get('title'), 'url': r.get('url'), 'score': r.get('score') } for r in retrieved]
                return out
        except Exception:
            continue
    return None

def encode_image(img_rgb):
    try:
        if HAS_CV2 and cv2 is not None:
            _, buffer = cv2.imencode('.jpg', cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR))
            return base64.b64encode(buffer).decode('utf-8')
        else:
            # fallback: use PIL to save JPEG
            buf = io.BytesIO()
            Image.fromarray(img_rgb.astype('uint8')).save(buf, format='JPEG', quality=85)
            return base64.b64encode(buf.getvalue()).decode('utf-8')
    except Exception:
        # last resort: return empty string
        return ""

def _cleanup_expired_jobs():
    now = datetime.utcnow().timestamp()
    with ANALYSIS_LOCK:
        expired = [
            job_id
            for job_id, payload in ANALYSIS_JOBS.items()
            if (now - payload.get("updated_at_ts", now)) > ANALYSIS_TTL_SECONDS
        ]
        for job_id in expired:
            ANALYSIS_JOBS.pop(job_id, None)

def _set_job(job_id, **updates):
    updates["updated_at_ts"] = datetime.utcnow().timestamp()
    with ANALYSIS_LOCK:
        if job_id not in ANALYSIS_JOBS:
            return
        ANALYSIS_JOBS[job_id].update(updates)

def _safe_job_response(job):
    return {
        "analysis_id": job.get("analysis_id"),
        "status": job.get("status"),
        "error": job.get("error"),
        "_id": job.get("_id"),
        "filename": job.get("filename"),
        "grade": job.get("grade"),
        "grade_name": job.get("grade_name"),
        "confidence": job.get("confidence"),
        "clinical_audit": job.get("clinical_audit"),
        "patient_report": job.get("patient_report"),
        "xai_agreement": job.get("xai_agreement"),
        "vlm_alignment": job.get("vlm_alignment"),
        "review_required": job.get("review_required"),
        "review_risk": job.get("review_risk"),
        "review_reason": job.get("review_reason"),
        "model_vlm_contradiction": job.get("model_vlm_contradiction"),
        "images": job.get("images", {}),
        "timestamp": job.get("timestamp"),
    }

def _generate_xai_bundle(image_data, predicted_class):
    image = Image.open(io.BytesIO(image_data)).convert('RGB')
    img_np = np.array(image.resize((224, 224)))
    input_tensor = transform(image).unsqueeze(0).to(device)

    target_layers = [model.layer4[-1]]
    cam = GradCAM(model=model, target_layers=target_layers)
    grad_mask = cam(input_tensor=input_tensor, targets=None)[0, :]
    grad_viz = show_cam_on_image(np.float32(img_np) / 255, grad_mask, use_rgb=True)

    lime_viz, lime_mask = get_lime_explanation(img_np, model, predicted_class)

    shap_mask = get_shap_explanation(input_tensor, model, predicted_class)
    shap_viz = show_cam_on_image(np.float32(img_np) / 255, shap_mask, use_rgb=True)

    m_grad = (grad_mask - grad_mask.min()) / (grad_mask.max() - grad_mask.min() + 1e-8)
    m_lime = cv2.resize(lime_mask.astype(float), (224, 224))
    m_lime = (m_lime - m_lime.min()) / (m_lime.max() - m_lime.min() + 1e-8)
    m_shap = (shap_mask - shap_mask.min()) / (shap_mask.max() - shap_mask.min() + 1e-8)
    consensus_mask = np.mean([m_grad, m_lime, m_shap], axis=0)
    consensus_viz = show_cam_on_image(np.float32(img_np) / 255, consensus_mask, use_rgb=True)
    agreement_score = _compute_xai_agreement(m_grad, m_lime, m_shap)
    # Create a short RAG-style XAI summary for VLM context
    try:
        top_regions = []
        # rough extraction: find centroid of consensus high areas
        thresh = consensus_mask > 0.5
        if thresh.sum() > 0:
            ys, xs = np.where(thresh)
            cy, cx = int(np.mean(ys)), int(np.mean(xs))
            top_regions.append(f"consensus_centroid=({cx},{cy})")
        top_regions.append(f"agreement={round(agreement_score,3)}")
        xai_summary = "; ".join(top_regions)
    except Exception:
        xai_summary = "agreement={:.3f}".format(agreement_score)

    # Ensure XAI images match original aspect ratio for consistent UI rendering
    orig_size = image.size # (width, height)
    
    def resize_to_original(img_array):
        if HAS_CV2 and cv2 is not None:
            return cv2.resize(img_array, orig_size, interpolation=cv2.INTER_LINEAR)
        else:
            return np.array(Image.fromarray(img_array.astype(np.uint8)).resize(orig_size, Image.BILINEAR))

    return {
        "consensus_viz": consensus_viz,
        "agreement_score": round(agreement_score, 4),
        "images": {
            "original": encode_image(np.array(image)),
            "gradcam": encode_image(resize_to_original(grad_viz)),
            "lime": encode_image(resize_to_original(lime_viz)),
            "shap": encode_image(resize_to_original(shap_viz)),
            "consensus": encode_image(resize_to_original(consensus_viz)),
        },
        "xai_summary": xai_summary,
    }

async def _run_staged_pipeline(job_id, image_data, filename, predicted_class, confidence, grade_name):
    try:
        _set_job(job_id, status="xai_processing")
        xai_bundle = await asyncio.to_thread(_generate_xai_bundle, image_data, predicted_class)
        _set_job(job_id, status="xai_ready", images=xai_bundle["images"], xai_agreement=round(xai_bundle["agreement_score"] * 100, 2), xai_summary=xai_bundle.get("xai_summary"))

        _set_job(job_id, status="vlm_processing")
        image = Image.open(io.BytesIO(image_data)).convert('RGB')
        heatmap = Image.fromarray(xai_bundle["consensus_viz"])

        ai_response = await asyncio.to_thread(
            get_gemini_explanation,
            image,
            heatmap,
            grade_name,
            confidence * 100,
            ["Grad-CAM", "LIME", "SHAP"],
            xai_bundle["agreement_score"],
            xai_bundle.get("xai_summary"),
        )

        clinical_audit = ai_response.get("clinical_audit") if isinstance(ai_response, dict) else "Clinical interpretation generated."
        patient_report = ai_response.get("patient_report") if isinstance(ai_response, dict) else "Analysis complete. View technical details below."
        vlm_alignment = ai_response.get("evidence_alignment") if isinstance(ai_response, dict) else "unknown"
        vlm_grade_hint = ai_response.get("vlm_grade_hint") if isinstance(ai_response, dict) else None

        guardrails = _build_guardrail_assessment(
            predicted_class=predicted_class,
            confidence_pct=round(confidence * 100, 2),
            vlm_grade_hint=vlm_grade_hint,
            alignment=vlm_alignment,
            xai_agreement=xai_bundle["agreement_score"],
        )

        result_payload = {
            "timestamp": datetime.utcnow().isoformat(),
            "filename": filename,
            "grade": predicted_class,
            "grade_name": grade_name,
            "confidence": round(confidence * 100, 2),
            "clinical_audit": clinical_audit,
            "patient_report": patient_report,
            "xai_agreement": round(xai_bundle["agreement_score"] * 100, 2),
            "vlm_alignment": vlm_alignment,
            "review_required": guardrails["review_required"],
            "review_risk": guardrails["review_risk"],
            "review_reason": guardrails["review_reason"],
            "model_vlm_contradiction": guardrails["model_vlm_contradiction"],
            "images": xai_bundle["images"],
            "sources": ai_response.get('sources') if isinstance(ai_response, dict) else None,
            "suggestions": ai_response.get('suggestions') if isinstance(ai_response, dict) else [],
        }

        if AsyncSessionLocal:
            async with AsyncSessionLocal() as session:
                record = DiagnosticRecord(
                    id=job_id,
                    filename=filename,
                    timestamp=result_payload["timestamp"],
                    grade=predicted_class,
                    grade_name=grade_name,
                    confidence=result_payload["confidence"],
                    clinical_audit=clinical_audit,
                    patient_report=patient_report,
                    xai_agreement=result_payload["xai_agreement"],
                    vlm_alignment=vlm_alignment,
                    review_required=guardrails["review_required"],
                    review_risk=guardrails["review_risk"],
                    review_reason=guardrails["review_reason"],
                    images=xai_bundle["images"],
                    suggestions=result_payload["suggestions"],
                    sources=result_payload["sources"]
                )
                session.add(record)
                await session.commit()
                result_payload["_id"] = job_id
                print(f"💾 Record saved to PostgreSQL for {filename}")

        _set_job(
            job_id,
            status="complete",
            _id=result_payload.get("_id"),
            clinical_audit=clinical_audit,
            patient_report=patient_report,
            xai_agreement=result_payload["xai_agreement"],
            vlm_alignment=result_payload["vlm_alignment"],
            review_required=result_payload["review_required"],
            review_risk=result_payload["review_risk"],
            review_reason=result_payload["review_reason"],
            model_vlm_contradiction=result_payload["model_vlm_contradiction"],
            timestamp=result_payload["timestamp"],
            images=result_payload["images"],
        )
    except Exception as e:
        print(f"❌ Staged Analysis Failed: {e}")
        _set_job(job_id, status="error", error=str(e))

@app.get("/")
async def read_root():
    return {
        "status": "Online", 
        "database": "PostgreSQL Connected" if engine else "Disconnected",
        "model": "Loaded" if model is not None else "Error"
    }

@app.get("/records")
async def get_records():
    if not AsyncSessionLocal:
        return []
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(DiagnosticRecord).order_by(DiagnosticRecord.timestamp.desc()).limit(50))
            records = result.scalars().all()
            return [
                {
                    "_id": r.id,
                    "filename": r.filename,
                    "timestamp": r.timestamp,
                    "grade": r.grade,
                    "grade_name": r.grade_name,
                    "confidence": r.confidence,
                    "clinical_audit": r.clinical_audit,
                    "patient_report": r.patient_report,
                    "xai_agreement": r.xai_agreement,
                    "vlm_alignment": r.vlm_alignment,
                    "review_required": r.review_required,
                    "review_risk": r.review_risk,
                    "review_reason": r.review_reason,
                    "images": r.images,
                    "suggestions": r.suggestions,
                    "sources": r.sources
                } for r in records
            ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/records/{record_id}")
async def delete_record(record_id: str):
    if not AsyncSessionLocal:
        raise HTTPException(status_code=500, detail="Database disconnected")
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(delete(DiagnosticRecord).where(DiagnosticRecord.id == record_id))
            await session.commit()
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
        grade_name = DR_GRADES[predicted_class]

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
        agreement_score = _compute_xai_agreement(m_grad, m_lime, m_shap)
        # build a short xai_summary for RAG-style context
        try:
            top_regions = []
            thresh = consensus_mask > 0.5
            if thresh.sum() > 0:
                ys, xs = np.where(thresh)
                cy, cx = int(np.mean(ys)), int(np.mean(xs))
                top_regions.append(f"consensus_centroid=({cx},{cy})")
            top_regions.append(f"agreement={round(agreement_score,3)}")
            xai_summary = "; ".join(top_regions)
        except Exception:
            xai_summary = "agreement={:.3f}".format(agreement_score)

        ai_response = get_gemini_explanation(
            image,
            Image.fromarray(consensus_viz),
            grade_name,
            confidence * 100,
            ["Grad-CAM", "LIME", "SHAP"],
            agreement_score,
            xai_summary,
        )

        clinical_audit = ai_response.get("clinical_audit") if isinstance(ai_response, dict) else "Clinical interpretation generated."
        patient_report = ai_response.get("patient_report") if isinstance(ai_response, dict) else "Analysis complete. View technical details below."
        vlm_alignment = ai_response.get("evidence_alignment") if isinstance(ai_response, dict) else "unknown"
        vlm_grade_hint = ai_response.get("vlm_grade_hint") if isinstance(ai_response, dict) else None

        guardrails = _build_guardrail_assessment(
            predicted_class=predicted_class,
            confidence_pct=round(confidence * 100, 2),
            vlm_grade_hint=vlm_grade_hint,
            alignment=vlm_alignment,
            xai_agreement=agreement_score,
        )

        # 5. Database Persistence
        result_payload = {
            "timestamp": datetime.utcnow().isoformat(),
            "filename": file.filename,
            "grade": predicted_class,
            "grade_name": grade_name,
            "confidence": round(confidence * 100, 2),
            "clinical_audit": clinical_audit,
            "patient_report": patient_report,
            "xai_agreement": round(agreement_score * 100, 2),
            "vlm_alignment": vlm_alignment,
            "review_required": guardrails["review_required"],
            "review_risk": guardrails["review_risk"],
            "review_reason": guardrails["review_reason"],
            "model_vlm_contradiction": guardrails["model_vlm_contradiction"],
            "sources": ai_response.get('sources') if isinstance(ai_response, dict) else None,
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

@app.post("/analyze/start")
async def start_analyze_image(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    if model is None and not load_model():
        raise HTTPException(status_code=500, detail="Model unavailable")

    try:
        _cleanup_expired_jobs()

        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data)).convert('RGB')
        input_tensor = transform(image).unsqueeze(0).to(device)

        with torch.no_grad():
            outputs = model(input_tensor)
            probs = torch.nn.functional.softmax(outputs, dim=1).cpu().numpy()[0]

        predicted_class = int(np.argmax(probs))
        confidence = float(np.max(probs))
        grade_name = DR_GRADES[predicted_class]

        analysis_id = str(uuid4())
        now_iso = datetime.utcnow().isoformat()
        initial_job = {
            "analysis_id": analysis_id,
            "status": "decision_ready",
            "error": None,
            "_id": None,
            "filename": file.filename,
            "grade": predicted_class,
            "grade_name": grade_name,
            "confidence": round(confidence * 100, 2),
            "clinical_audit": "",
            "patient_report": "",
            "xai_agreement": None,
            "vlm_alignment": "pending",
            "review_required": None,
            "review_risk": "pending",
            "review_reason": "Reliability checks pending VLM output",
            "model_vlm_contradiction": None,
            "images": {
                "original": encode_image(np.array(image.resize((400, 400))))
            },
            "timestamp": now_iso,
            "updated_at_ts": datetime.utcnow().timestamp(),
        }

        with ANALYSIS_LOCK:
            ANALYSIS_JOBS[analysis_id] = initial_job

        background_tasks.add_task(
            _run_staged_pipeline,
            analysis_id,
            image_data,
            file.filename,
            predicted_class,
            confidence,
            grade_name,
        )

        return _safe_job_response(initial_job)
    except Exception as e:
        print(f"❌ Analysis Start Failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analyze/status/{analysis_id}")
async def get_analyze_status(analysis_id: str):
    _cleanup_expired_jobs()
    with ANALYSIS_LOCK:
        job = ANALYSIS_JOBS.get(analysis_id)

    if not job:
        raise HTTPException(status_code=404, detail="Analysis job not found or expired")

    return _safe_job_response(job)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)