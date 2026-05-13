# DiabEYEtic Insight: Explainable AI for Diabetic Retinopathy Detection

## Project Overview
DiabEYEtic Insight is an advanced diagnostic platform designed to detect Diabetic Retinopathy (DR) from retinal fundus images. Beyond simple classification, the system integrates a multi-layered Explainable AI (XAI) suite to provide clinicians with transparent, visual evidence for every diagnosis. By combining deep learning with large language models, the platform generates automated clinical audits and patient-friendly reports, bridging the gap between complex AI outputs and actionable medical insights.

## Core Features
- **Automated DR Grading**: Classifies retinal images into five clinical stages: No DR, Mild, Moderate, Severe, and Proliferative Diabetic Retinopathy.
- **Explainable AI (XAI) Suite**: Implements Grad-CAM, LIME, and SHAP to highlight pathological features such as microaneurysms, hemorrhages, and exudates.
- **Consensus Visualization**: Generates a unified heatmap by aggregating multiple XAI methods, reducing interpretation bias and increasing diagnostic confidence.
- **AI Clinical Auditor**: Utilizes Google Gemini to transform visual heatmaps and classification data into structured clinical audits for ophthalmologists.
- **Patient-Centric Reporting**: Automatically generates simplified diagnostic summaries to improve patient understanding and compliance.
- **Comprehensive Dashboard**: Provides a centralized hub for real-time analytics, historical patient records, and diagnostic trends.
- **Secure Data Persistence**: Integrates with MongoDB for reliable storage of diagnostic history and high-resolution XAI visualizations.

## Technology Stack

### Frontend
- **Framework**: React 19 (Vite)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Data Visualization**: Recharts
- **Icons**: Lucide React

### Backend
- **API Framework**: FastAPI (Python)
- **Deep Learning**: PyTorch
- **Computer Vision**: OpenCV, PIL
- **Explainable AI**: SHAP, Lime, PyTorch-Grad-CAM
- **Generative AI**: Google Generative AI (Gemini)

### Database & Infrastructure
- **Database**: MongoDB (Motor for asynchronous operations)
- **Environment**: Python Dotenv for secure configuration

## System Architecture
The system follows a decoupled architecture:
1. **Frontend**: A responsive React dashboard that handles image uploads and displays complex XAI visualizations.
2. **Backend**: A high-performance FastAPI server that manages the model inference pipeline and XAI generation.
3. **Inference Engine**: A ResNet50 model fine-tuned on the APTOS dataset for high-precision retinal analysis.
4. **Interpretation Layer**: An ensemble of XAI algorithms that process the model's internal activations to identify diagnostic markers.
5. **Synthesis Layer**: LLM-driven reporting that contextualizes the numerical and visual data into human-readable text.

## Installation and Setup

### Prerequisites
- Python 3.9+
- Node.js 18+
- MongoDB instance
- Gemini API Key

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Configure environment variables in a `.env` file:
   ```env
   MONGODB_URI=your_mongodb_uri
   GEMINI_API_KEY=your_gemini_api_key
   ```
4. Start the server:
   ```bash
   python main.py
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Future Roadmap
- Integration of longitudinal tracking to monitor disease progression over time.
- Support for multi-modal data (e.g., patient history, blood glucose levels).
- Deployment of a mobile-responsive interface for point-of-care diagnostics.
- Expansion of the model to detect other retinal pathologies such as Glaucoma and Macular Degeneration.
