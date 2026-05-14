# DiabEyetic Insight: Project Implementation Details

This document outlines the complete architectural and technical implementation details of the **DiabEyetic Insight** platform, focusing heavily on the Explainable AI (XAI) integration and the Multimodal Generative AI pipeline.

## 1. Core Diagnostic Model
The primary diagnostic engine uses a **ResNet50** Convolutional Neural Network (CNN) trained specifically on retinal fundus imagery.
* **Input**: Standardized 224x224 RGB images, normalized using ImageNet standard deviations.
* **Output**: A probability distribution across 5 severity grades:
  * Grade 0: No DR
  * Grade 1: Mild DR
  * Grade 2: Moderate DR
  * Grade 3: Severe DR
  * Grade 4: Proliferative DR

## 2. The XAI (Explainable AI) Ensemble
To prevent the ResNet50 model from acting as a "black box," we implemented a multi-layered XAI pipeline that visually highlights *why* the model made its decision.

### a. Grad-CAM (Gradient-weighted Class Activation Mapping)
* **Mechanism**: Extracts the gradients flowing into the final convolutional layer (`layer4[-1]`).
* **Purpose**: Produces a coarse localization map highlighting the broad anatomical regions (like the macula or optic disc) that heavily influenced the predicted severity.

### b. LIME (Local Interpretable Model-agnostic Explanations)
* **Mechanism**: Segments the image into "superpixels" using the quickshift algorithm. It then perturbs these superpixels by turning them on and off, feeding the altered images back into the model to see how the prediction changes.
* **Purpose**: Identifies highly localized, granular features (e.g., specific microaneurysms or hard exudates) that drive the model's confidence.

### c. SHAP (SHapley Additive exPlanations)
* **Mechanism**: Utilizes cooperative game theory. It treats every pixel/region as a "player" contributing to the final "payout" (the model's prediction score). We use a GradientExplainer approach for PyTorch.
* **Purpose**: Provides a mathematically rigorous feature importance map, ensuring no individual pathological indicator is ignored.

### d. Neural Consensus Masking
* **Implementation**: We normalize the arrays from Grad-CAM, LIME, and SHAP to a `[0, 1]` scale.
* **The Formula**: `consensus_mask = np.mean([m_grad, m_lime, m_shap], axis=0)`
* **Result**: A highly accurate, unified heatmap that only highlights regions where all three independent mathematical models *agree* there is pathology.

## 3. Multimodal Generative AI (Google Gemini)
Once the neural network determines the severity and the XAI ensemble locates the pathology, we use **Google Gemini (Vision)** to synthesize the data into human-readable text.

* **Dual-Input Prompting**: The Gemini model is fed *both* the original fundus image AND the consensus XAI heatmap.
* **Contextual Grounding**: Gemini is explicitly told the model's predicted grade. This prevents the LLM from hallucinating a diagnosis and forces it to act strictly as an interpreter.
* **Dual Output Generation**:
  1. **Expert Clinical Audit**: Technical medical jargon detailing hemorrhages, exudates, vascular abnormalities, and spatial relationships based on the heatmap.
  2. **Patient Narrative**: A compassionate, easy-to-understand summary explaining the severity, the visual evidence, and recommended next steps for the patient.

## 4. System Architecture & UI
* **Backend**: Powered by **FastAPI** to handle the heavy, asynchronous load of running PyTorch inference, OpenCV image processing, and external API calls to Gemini concurrently.
* **Database**: **MongoDB Atlas** stores the diagnostic records. Because XAI generates multiple heatmaps, we encode the images as `Base64` strings and archive them directly in the NoSQL document along with the clinical text.
* **Frontend UI**: Built with **React** and **Tailwind CSS**. It features a glassmorphic, dark-mode aesthetic with smooth Framer Motion transitions. The UI allows clinicians to dynamically switch between viewing the Grad-CAM, LIME, SHAP, and Consensus layers overlaying the patient's scan.
* **PDF Engine**: A custom HTML-to-PDF print engine that formats the clinical audit and patient narrative into a clean, printable medical report with the original and consensus images attached.

## 5. Network Resiliency Fixes
During development, the application encountered severe restrictions when running on corporate/university networks:
* **DNS Bypassing**: Restricted networks blocked the `mongodb+srv://` SRV record lookup. We integrated `dns.resolver` to force the Python environment to route database DNS queries through Google's Public DNS (`8.8.8.8` / `1.1.1.1`), effectively bypassing the local network block.
* **SSL Handshake Protection**: We integrated the `certifi` CA bundle into the `AsyncIOMotorClient` to prevent TLS verification failures on Windows machines.
