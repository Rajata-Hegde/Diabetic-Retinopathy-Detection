# RetinaCare: Diabetic Retinopathy Detection Platform

A modern, AI-powered clinical dashboard for screening and monitoring Diabetic Retinopathy (DR) using Deep Learning and Google Gemini.

## 🚀 Features

- **AI Inference**: Automated DR grading (0-4) using a ResNet50 model.
- **RetinAI Assistant**: Interactive chatbot powered by Gemini 2.0 for clinical guidance.
- **Clinical Dashboard**: Real-time stats on scans, urgent cases, and patient trends.
- **Patient Management**: Timeline-based records and progression tracking.

---

## 🛠️ Setup Instructions

### 1. Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- Git LFS (`git lfs install`)

### 2. Frontend Setup (React + Vite)
```bash
cd frontend
npm install
cp .env.example .env
# Add your VITE_GEMINI_API_KEY to .env
npm run dev
```

### 3. Backend Setup (FastAPI + PyTorch)
The backend runs the ResNet50 model locally.
```bash
cd backend
python -m pip install -r requirements.txt
# Download the model files
git lfs install
git clone https://huggingface.co/sakshamkr1/ResNet50-APTOS-DR
# Start the server
python main.py
```

---

## 🧠 Model Information
The platform uses a **ResNet50** architecture trained on the **APTOS 2019 Blindness Detection** dataset. 
- **Input**: 224x224 Retinal Fundus Images.
- **Output**: 5-class classification (No DR, Mild, Moderate, Severe, Proliferative DR).

---

## 📄 License
This project is for educational and research purposes. Always consult a qualified ophthalmologist for clinical decisions.
