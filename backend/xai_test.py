import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image
import numpy as np
import cv2
import os
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget
from pytorch_grad_cam.utils.image import show_cam_on_image

# --- CONFIGURATION ---
# Use the existing ResNet50 model path relative to this script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "ResNet50-APTOS-DR", "diabetic_retinopathy_full_model.pth")
# Put an image path here to test (e.g., from your dataset or a sample eye image)
TEST_IMAGE_PATH = os.path.join(BASE_DIR, "sample_eye.png") 
OUTPUT_PATH = os.path.join(BASE_DIR, "explanation_heatmap.jpg")

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def run_xai():
    # 1. Load the model
    if not os.path.exists(MODEL_PATH):
        print(f"Error: Model not found at {MODEL_PATH}")
        return

    print(f"Loading model on {device}...")
    model = torch.load(MODEL_PATH, map_location=device, weights_only=False)
    model.eval()

    # 2. Define the target layer for Grad-CAM (Last conv layer of ResNet50)
    # Note: If your model has a specific wrapper, this might need adjustment
    target_layers = [model.layer4[-1]]

    # 3. Preprocess the image
    if not os.path.exists(TEST_IMAGE_PATH):
        print(f"Please provide a valid image at: {TEST_IMAGE_PATH}")
        print("Note: You can use any retinal image from your dataset.")
        return

    rgb_img = cv2.imread(TEST_IMAGE_PATH, 1)[:, :, ::-1] # BGR to RGB
    rgb_img = np.float32(rgb_img) / 255
    input_tensor = transforms.Compose([
        transforms.ToPILImage(),
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])(cv2.imread(TEST_IMAGE_PATH, 1)[:, :, ::-1]).unsqueeze(0).to(device)

    # 4. Initialize Grad-CAM
    cam = GradCAM(model=model, target_layers=target_layers)

    # 5. Generate heatmap for the predicted class
    # We pass None to target the highest scoring category
    grayscale_cam = cam(input_tensor=input_tensor, targets=None)
    grayscale_cam = grayscale_cam[0, :]

    # 6. Overlay heatmap on original image
    # Resize original image to match CAM output (224x224)
    img_for_overlay = cv2.resize(rgb_img, (224, 224))
    visualization = show_cam_on_image(img_for_overlay, grayscale_cam, use_rgb=True)

    # 7. Save result
    cv2.imwrite(OUTPUT_PATH, cv2.cvtColor(visualization, cv2.COLOR_RGB2BGR))
    print(f"Success! Explanation heatmap saved to: {OUTPUT_PATH}")

if __name__ == "__main__":
    run_xai()
