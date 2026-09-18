---
description: Strict academic scope rules enforcing classical CG/IP algorithms and prohibiting deep learning.
always_on: true
---

# Stylinger — Academic Scope & Algorithmic Integrity Rules

This rule enforces academic compliance with the submitted Stylinger CG/IP project proposal and `docs/project/rules.md`.

## 1. Proposal is the Inviolable Source of Truth
- The authoritative system workflow is:
  `User` → `Upload Image` → `Image Preprocessing` → `Background Segmentation` → `Feature & Contour Extraction` → `Clothing Selection` → `Garment Alignment & Transformation` → `Image Compositing / Alpha Blending` → `Outfit Visualization` → `Save / Download`.
- All features and changes must trace directly to this sequence.

## 2. Strict Classical Computer Vision Constraint
- All computer vision and image processing operations must be implemented using **classical, deterministic algorithms** via OpenCV, NumPy, and Pillow.
- Permitted techniques:
  - Color space conversions (RGB, Grayscale ITU-R BT.601, HSV).
  - Spatial domain convolution (Gaussian smoothing, bilateral filtering).
  - Mathematical morphology (Structuring elements, Erosion, Dilation, Opening, Closing).
  - Gradient and edge analysis (Sobel kernels, Canny hysteresis thresholding).
  - Contour tracking, spatial moments, bounding boxes, and horizontal/vertical intensity projection profiling.
  - 2D Affine transformations ($2 \times 3$ affine matrix via `cv2.getAffineTransform` and `cv2.warpAffine`).
  - Multi-channel linear alpha blending and Gaussian edge feathering.

## 3. Absolute Ban on Deep Learning & External Black-Box AI
The following are **STRICTLY FORBIDDEN** across all files, tools, and dependencies:
- **NO YOLO** or object detection neural networks.
- **NO MediaPipe** or neural pose/landmark estimators.
- **NO PyTorch, TensorFlow, Keras, ONNX**, or deep neural network weights.
- **NO Generative AI, GANs, or Diffusion Models**.
- **NO Cloud or Paid External AI APIs** (e.g., commercial virtual try-on APIs).
- **NO 3D Mesh Rendering, 3D Garment Simulation, or Physics Rigging**.

## 4. Testing & Verification Requirements
- All new image processing algorithms added to `src/processing/` must have corresponding headless unit tests in `tests/`.
- The existing baseline smoke tests (`tests/test_pipeline.py`) must pass 100% at all times.
- The desktop PyQt5 baseline (`python src/main.py`) must never be broken or deleted.
