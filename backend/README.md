Diabetic Retinopathy Detection — Backend README

This backend is a demo-ready FastAPI service that supports a fully offline safe-mode when optional ML/XAI and LLM dependencies are missing.

Quick start (minimal, no optional packages):

1) Create a Python venv and install minimal requirements:

```bash
python -m venv .venv
.\.venv\Scripts\activate
pip install fastapi uvicorn pillow numpy
```

2) Run the backend demo (uses conservative fallback explainers and VLM if heavy deps missing):

```bash
cd backend
python main.py
# or
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

3) Start the frontend (from repo root):

```bash
cd frontend
npm install
npm run dev
```

What the fallback mode does
- If `cv2`, `pytorch_grad_cam`, `lime`, `shap`, or `google.generativeai` are not installed or a Gemini API key is not set, the backend will run safe deterministic fallbacks:
  - Simple center-based masks for explainability
  - Rule-based, conservative textual findings and suggestions
  - Optional retrieval (`retrieval/`) is used when `sentence-transformers` + `faiss-cpu` index is built

Optional: Full features
- For production-like behavior (vector retrieval, richer explainers, and VLM), install the optional packages and create a `.env` with `GEMINI_API_KEY` and `MONGODB_URI`.

Recommended optional install for full RAG + XAI:

```bash
pip install -r requirements.txt
pip install sentence-transformers faiss-cpu shap lime pytorch-grad-cam opencv-python google-generativeai motor
```

Indexing retrieval data:

```bash
python ../retrieval/build_index.py
```

Notes
- The backend includes analytics endpoints (`/analytics/log`, `/analytics/stats`) and stores records to MongoDB when configured.
- The fallback mode is intentionally conservative to avoid hallucinations.

*** End README
