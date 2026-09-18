# Stylinger — Product Requirements Document (PRD)

**Document Status:** Approved Academic Specification  
**Project:** Stylinger — Virtual Fashion Styling using Computer Graphics and Image Processing  
**Course:** Computer Graphics & Image Processing (CG/IP)  
**Academic Milestone:** Web Application Architecture & Specification Phase  
**Source of Truth:** Stylinger CG/IP Project Proposal  

---

## 1. Executive Summary & Purpose

**Stylinger** is an academic virtual fashion styling platform engineered to demonstrate core **Computer Graphics (CG)** and **Digital Image Processing (DIP)** algorithms. The system enables users to upload a full-body portrait, isolate the subject from the background, identify key body regions (torso and shoulders), and digitally drape 2D clothing items onto the subject using spatial geometric transformations and alpha compositing.

Unlike commercial virtual try-on systems that rely on opaque deep learning models, generative AI, or complex 3D physics engines, Stylinger's mission is **mathematical transparency and educational interpretability**. Every stage of the garment transformation—from color space conversions to affine mapping and feather-masked alpha blending—is implemented using classical, deterministic digital image processing operators.

---

## 2. Problem Statement & Target Audience

### 2.1 The Problem
- **Educational Gap:** Modern computer vision in fashion is overwhelmingly dominated by black-box deep neural networks (CNNs, GANs, Diffusion Models), obscuring the fundamental mathematical and matrix manipulations (spatial filtering, affine matrices, morphological operators, color slicing) that make visual manipulation possible.
- **Accessibility & Computational Overhead:** Deep learning virtual try-on systems require intensive GPU infrastructure, large proprietary datasets, and slow inference cycles. There is a need for a lightweight, deterministic, and instant system that demonstrates virtual try-on concepts using pure image processing mathematics.

### 2.2 Target Users
1. **Academic Evaluators & Faculty:** Assessing student mastery of core CG/IP curriculum topics (filtering, color spaces, transformations, contours, compositing).
2. **Computer Science Students & Researchers:** Studying deterministic computer vision algorithms and their real-world applications in fashion technology.
3. **Fashion-Tech Enthusiasts:** Seeking an intuitive, interactive web tool to experiment with digital styling and inspect the underlying visual transformations.

---

## 3. Academic Objectives & Syllabus Alignment

Stylinger directly implements and demonstrates core topics from the Computer Graphics and Image Processing syllabus:

| Syllabus Domain | Academic Topic | Stylinger Pipeline Implementation |
| :--- | :--- | :--- |
| **Color Spaces** | RGB, Grayscale, HSV Representations | Luminance conversion (ITU-R BT.601) and HSV color slicing for skin/background isolation. |
| **Spatial Filtering** | Noise Reduction & Convolution | Gaussian smoothing ($5 \times 5$ kernel) and bilateral edge-preserving filtering. |
| **Morphological Operations** | Mathematical Morphology | Structuring elements ($3 \times 3$, $5 \times 5$) applying Erosion, Dilation, Opening, and Closing for mask cleanup. |
| **Edge & Feature Detection** | Gradient Calculation & Contours | Multi-stage Canny Edge Detection and topological contour hierarchy analysis (`cv2.findContours`). |
| **Geometric Transformations** | 2D Spatial Affine Mapping | Matrix formulation for translation, non-uniform scaling, rotation, and 3-point affine mapping (`cv2.warpAffine`). |
| **Image Compositing** | Alpha Blending & Transparency | 4-channel alpha matting, edge feathering via Gaussian blur masks, and linear convex combination compositing. |

---

## 4. User Journey & End-to-End Workflow

```
┌─────────────────┐     ┌───────────────────────┐     ┌──────────────────────┐
│  1. Upload      │ ──> │  2. Preprocessing     │ ──> │  3. Background &    │
│     Portrait    │     │     (Noise Filtering) │     │     Skin Segmentation│
└─────────────────┘     └───────────────────────┘     └──────────────────────┘
                                                                 │
                                                                 ▼
┌─────────────────┐     ┌───────────────────────┐     ┌──────────────────────┐
│  6. Garment     │ <── │  5. Garment Selection │ <── │  4. Contour & Body   │
│     Alignment   │     │     from Catalog      │     │     Region Detection │
└─────────────────┘     └───────────────────────┘     └──────────────────────┘
        │
        ▼
┌─────────────────┐     ┌───────────────────────┐     ┌──────────────────────┐
│  7. Alpha       │ ──> │  8. Outfit            │ ──> │  9. Save / Export    │
│     Compositing │     │     Visualization     │     │     High-Res Result  │
└─────────────────┘     └───────────────────────┘     └──────────────────────┘
```

1. **Upload:** User drags or selects an upper-body or full-body portrait (JPG/PNG).
2. **Preprocessing:** The image is scaled to a standardized working resolution and filtered to eliminate sensor noise.
3. **Segmentation:** The image is transformed into HSV color space to generate binary segmentation masks separating person from background.
4. **Feature & Contour Extraction:** Morphological opening/closing cleans the mask; Canny and contour tracking locate body silhouettes.
5. **Body-Region Estimation:** Classical geometric heuristics compute shoulder width, neck center, and torso boundary anchor points.
6. **Garment Selection:** User selects an apparel item (e.g., t-shirt, jacket) from the curated transparent PNG catalog.
7. **Alignment & Transformation:** The garment's intrinsic anchor points are mathematically mapped to the subject's detected torso anchors using a $2 \times 3$ Affine Transformation matrix.
8. **Alpha Compositing:** The transformed garment layer is blended seamlessly onto the subject using feathered alpha channel masks and color matching.
9. **Visualization & Inspection:** The user inspects the styled outfit, sweeps an interactive before/after comparison curtain, views intermediate algorithm stages, and downloads the final composite.

---

## 5. Core Feature Requirements

### 5.1 Image Ingestion & Preprocessing
- **FR-1.1:** Support file uploads for standard image formats (`.png`, `.jpg`, `.jpeg`, `.webp`).
- **FR-1.2:** Enforce maximum file size (10 MB) and minimum pixel dimensions ($300 \times 300$ px).
- **FR-1.3:** Provide immediate client-side preview with aspect-ratio preservation.
- **FR-1.4:** Apply standard spatial filtering (Gaussian blur and bilateral filtering) to prepare matrices for gradient analysis.

### 5.2 Classical Segmentation & Contour Extraction
- **FR-2.1:** Transform RGB input into HSV (Hue, Saturation, Value) color space to decouple illumination from chromaticity.
- **FR-2.2:** Isolate background and identify subject silhouette using multi-band HSV thresholding.
- **FR-2.3:** Clean binary segmentation masks using mathematical morphology (Erosion, Dilation, Morphological Opening to remove salt noise, Morphological Closing to fill holes).
- **FR-2.4:** Execute Canny edge detection to capture clothing and torso outlines.
- **FR-2.5:** Extract external contours and compute spatial moments, bounding boxes, and vertical centroid profiles.

### 5.3 Geometric Body-Region Estimation
- **FR-3.1:** Determine torso center line, shoulder span, and chest baseline using contour bounding geometry and horizontal scanline pixel density.
- **FR-3.2:** Generate bounding anchor coordinates: Left Shoulder $(X_{ls}, Y_{ls})$, Right Shoulder $(X_{rs}, Y_{rs})$, and Torso Base $(X_{tb}, Y_{tb})$.
- **FR-3.3:** Allow subtle user-guided manual micro-adjustments (fine-tune offsets: $\Delta x$, $\Delta y$, $\Delta \text{scale}$) for edge cases.

### 5.4 Curated Garment Catalog Management
- **FR-4.1:** Maintain a curated collection of segmented 4-channel RGBA apparel assets (T-shirts, shirts, jackets).
- **FR-4.2:** Each garment asset contains predefined reference anchor points corresponding to garment neck, left shoulder, right shoulder, and hemline.
- **FR-4.3:** Support garment categorization (Tops, Outerwear) with interactive gallery selection.

### 5.5 Spatial Affine Transformation & Warping
- **FR-5.1:** Compute the $2 \times 3$ Affine Transformation matrix $M$ that maps garment anchor coordinates to the detected subject torso coordinates.
- **FR-5.2:** Warp garment image and garment alpha mask using bilinear interpolation (`cv2.warpAffine` with `INTER_LINEAR`).
- **FR-5.3:** Handle edge clamping and coordinate clipping to ensure warped clothing fits within image matrix bounds.

### 5.6 Alpha Blending & Compositing
- **FR-6.1:** Extract 8-bit alpha channel $\alpha \in [0, 255]$ from the warped garment layer.
- **FR-6.2:** Apply a $3 \times 3$ or $5 \times 5$ Gaussian blur to the alpha channel boundary to produce a feathered transition mask, avoiding harsh pixel artifacts.
- **FR-6.3:** Execute per-pixel alpha blending according to the linear interpolation equation:
  $$I_{\text{composite}}(x, y) = \alpha_{\text{feathered}}(x, y) \cdot I_{\text{garment}}(x, y) + (1 - \alpha_{\text{feathered}}(x, y)) \cdot I_{\text{subject}}(x, y)$$
- **FR-6.4:** Perform luminance matching between subject lighting and garment layer using local intensity scaling.

### 5.7 Visualization, Comparison & Export Studio
- **FR-7.1:** Display high-fidelity side-by-side view of Original Subject vs. Styled Result.
- **FR-7.2:** Provide an interactive Before/After curtain slider allowing users to drag a vertical divider across the subject to reveal styling changes.
- **FR-7.3:** Educational "Pipeline Inspector" drawer/modal allowing students and evaluators to inspect intermediate matrix outputs: Grayscale, Blurred, HSV Mask, Cleaned Mask, Canny Edges, Contours, and Transformed Garment.
- **FR-7.4:** One-click download of the final composited image at full source resolution (PNG/JPG).

---

## 6. Scope Boundaries (Strictly Enforced)

### 6.1 Included Scope
- Pure Python 3.12, Flask, OpenCV (`opencv-python`), NumPy, Pillow, HTML5, CSS3, Vanilla ES6+ JavaScript.
- Classical, mathematical digital image processing algorithms.
- Local temporary session-based processing.
- Dual-interface preservation: PyQt5 desktop GUI preserved as the baseline smoke test application; modern Flask web application as the primary user-facing studio.

### 6.2 Explicitly Excluded Scope (Non-Negotiable)
- **NO Deep Learning Models:** No PyTorch, TensorFlow, Keras, ONNX runtimes.
- **NO MediaPipe:** No neural pose landmarks, no hand tracking, no selfie segmentation models.
- **NO YOLO / Object Detection Neural Nets:** No bounding box models, no pre-trained darknet/ultralytics weights.
- **NO Generative AI / Diffusion Models:** No Stable Diffusion, no ControlNet, no GAN-based virtual try-on.
- **NO External Paid APIs:** No cloud vision APIs, no SaaS try-on endpoints.
- **NO 3D Graphics / Virtual Simulation:** No Blender, no Three.js 3D meshes, no cloth physics simulations.
- **NO Database Systems:** No PostgreSQL, MySQL, MongoDB, SQLite; in-memory sessions and temporary files only.

---

## 7. Success Criteria & Quality Metrics

1. **Algorithmic Authenticity:** 100% of pipeline stages execute classical DIP algorithms (OpenCV/NumPy) without black-box inference.
2. **Execution Latency:** End-to-end transformation and compositing executes within $< 1.5$ seconds on standard consumer CPU hardware for images up to $1920 \times 1080$ px.
3. **Compositing Fidelity:** Garments align naturally onto the torso contour with smooth feathered borders without visible jagged halo artifacts.
4. **Educational Value:** All 8 intermediate pipeline stages are visually inspectable through the web UI.
5. **System Stability:** Graceful handling of edge cases (e.g., solid white backgrounds, low-contrast images, rotated portraits) with informative user feedback.
6. **Codebase Preservation:** Zero regression or breaking changes to the baseline PyQt5 desktop suite (`src/gui/main_window.py` and `tests/test_pipeline.py`).
