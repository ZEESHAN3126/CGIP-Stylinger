# Stylinger — Technical Architecture Specification (techspec.md)

**Document Status:** Approved Technical Architecture  
**Project:** Stylinger — Virtual Fashion Styling using Computer Graphics and Image Processing  
**Milestone:** Phase 1 Technical Specification  
**Architecture Pattern:** Modular Layered Architecture (MVC / Service-Oriented Pipeline)  

---

## 1. System Architecture Overview

Stylinger adopts a decoupled, multi-layered architecture separating presentation, HTTP routing, business orchestration, and low-level computer vision processing.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT TIER                                     │
│  Vanilla HTML5 Semantic Markup  │  Custom CSS3 Tokens  │  Vanilla ES6+ JS   │
│  - Drag & Drop Upload Engine    │  - Comparison Slider │  - Pipeline Studio │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │ HTTP / REST (Multipart & JSON)
┌──────────────────────────────────────▼───────────────────────────────────────┐
│                              FLASK API TIER                                  │
│  Flask Application Server (`src/web/app.py` or `src/web/routes.py`)          │
│  - Session Management           - Input Validation & Sanitation              │
│  - Route Dispatchers            - File Ingestion & Temporary Artifact Store  │
└──────────────────┬───────────────────────────────────────────┬───────────────┘
                   │                                           │
┌──────────────────▼───────────────────────────┐ ┌─────────────▼───────────────┐
│        IMAGE PROCESSING PIPELINE CORE        │ │   CURATED GARMENT CATALOG   │
│  `src/processing/`                           │ │   `assets/garments/`        │
│  - `filters.py` (Grayscale, Blur, Canny)     │ │   - Standard RGBA PNGs      │
│  - `segmentation.py` (HSV Slicing & Masking) │ │   - `garments.json`         │
│  - `features.py` (Morphology & Contours)     │ │     (Anchor coordinates &   │
│  - `transform.py` (Affine Warping)           │ │      metadata)              │
│  - `compositing.py` (Alpha Feather & Blend)  │ └─────────────────────────────┘
└──────────────────┬───────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────────────────────────────┐
│                         LEGACY / SMOKE TEST LAYER                            │
│  PyQt5 Desktop Interface (`src/gui/main_window.py`)                          │
│  - Baseline Hello World Verification (`tests/test_pipeline.py`)              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack & Dependencies

### 2.1 Backend Core
- **Language:** Python 3.12 (Strict typing, standard library dataclasses)
- **Web Framework:** Flask 3.0+ (Microframework for lightweight REST endpoints)
- **Image Processing:** OpenCV (`opencv-python` 4.9+), NumPy 1.26+, Pillow (PIL) 10.2+
- **File Utilities:** Werkzeug (`secure_filename`)

### 2.2 Frontend Core
- **Markup:** Semantic HTML5 (No frontend build toolchains required)
- **Styling:** Vanilla CSS3 with Custom Properties (CSS variables), Flexbox, CSS Grid
- **Scripting:** Pure ECMAScript 6+ (Fetch API, DOM Events, Canvas API for interactive cursors)

### 2.3 Excluded Dependencies
- No React / Vue / Angular / Next.js
- No TailwindCSS or Bootstrap
- No PyTorch / TensorFlow / ONNX / MediaPipe / Ultralytics
- No SQL or NoSQL database servers

---

## 3. Directory Layout & Module Organization

```text
CGIP-STYLINGER/
├── assets/
│   └── garments/
│       ├── garments.json              # Catalog metadata & anchor definitions
│       ├── tshirts/
│       │   ├── tshirt_black_crew.png  # Transparent 4-channel RGBA
│       │   └── tshirt_white_vneck.png
│       └── jackets/
│           └── denim_jacket_blue.png
├── docs/
│   ├── architecture.md                # Baseline architecture
│   └── project/                       # Specification repository
│       ├── PRD.md
│       ├── techspec.md
│       ├── appflow.md
│       ├── design.md
│       ├── implementation.md
│       ├── schema.md
│       ├── rules.md
│       └── tracker.md
├── sample_images/                     # Test portraits for evaluation
├── src/
│   ├── __init__.py
│   ├── main.py                        # Launcher for desktop PyQt5 baseline
│   ├── gui/                           # Preserved PyQt5 baseline
│   │   ├── __init__.py
│   │   └── main_window.py
│   ├── processing/                    # Shared CV & DIP core algorithms
│   │   ├── __init__.py
│   │   ├── filters.py                 # Grayscale, Gaussian blur, Canny edge detection
│   │   ├── segmentation.py            # HSV transformation & color thresholding
│   │   ├── features.py                # Morphology, contours, body anchor geometry
│   │   ├── transform.py               # 2D affine transformation matrices & warping
│   │   ├── compositing.py             # Alpha blending, feathering & luminance matching
│   │   └── pipeline.py                # End-to-end styling pipeline orchestrator
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── image_utils.py             # Matrix conversions, text overlays
│   │   └── file_utils.py              # Session directory manager, cleanup helpers
│   └── web/                           # Flask web application module
│       ├── __init__.py
│       ├── app.py                     # Flask factory and configuration
│       ├── routes.py                  # API endpoints and static page routes
│       ├── static/                    # Frontend static assets
│       │   ├── css/
│       │   │   ├── variables.css      # Design tokens (colors, typography, spacing)
│       │   │   ├── main.css           # Global layout, cards, buttons
│       │   │   ├── comparison.css     # Interactive curtain slider styles
│       │   │   └── pipeline.css       # Step inspector drawer styles
│       │   └── js/
│       │       ├── api.js             # Fetch client wrapper
│       │       ├── upload.js          # Drag-and-drop & file validation
│       │       ├── slider.js          # Before/after comparison controller
│       │       ├── catalog.js         # Garment selection & preview
│       │       └── app.js             # Main orchestrator & state manager
│       └── templates/
│           ├── base.html              # Base layout template
│           └── index.html             # Virtual styling studio interface
├── temp/                              # Ephemeral runtime directory (.gitignore)
│   └── sessions/                      # Isolated session folders for processing
├── tests/
│   ├── __init__.py
│   ├── test_pipeline.py               # Existing baseline smoke tests
│   ├── test_segmentation.py           # Unit tests for HSV & morphology
│   ├── test_transform.py              # Unit tests for affine warp calculations
│   └── test_compositing.py            # Unit tests for alpha feathering
├── requirements.txt
└── README.md
```

---

## 4. Flask REST API & Communication Protocol

### 4.1 Route Specification Table

| Route | HTTP Method | Content-Type | Purpose |
| :--- | :--- | :--- | :--- |
| `/` | `GET` | `text/html` | Serves main single-page web studio interface. |
| `/api/upload` | `POST` | `multipart/form-data` | Ingests user portrait, validates, initializes session, returns metadata. |
| `/api/garments` | `GET` | `application/json` | Fetches catalog of available garments, categories, and reference anchors. |
| `/api/garment/<id>`| `GET` | `image/png` | Serves garment asset image file. |
| `/api/process` | `POST` | `application/json` | Runs pipeline for current session and selected garment ID with optional fine-tune offsets. |
| `/api/stages/<session_id>`| `GET` | `application/json` | Retrieves intermediate pipeline inspection artifacts (URLs or base64). |
| `/api/artifacts/<session_id>/<stage_name>`| `GET` | `image/png` | Streams intermediate debug matrix image (e.g., HSV mask, Canny edges). |
| `/api/download/<session_id>` | `GET` | `application/octet-stream` | Streams full-resolution final styled output image with download header. |
| `/api/reset/<session_id>` | `POST` | `application/json` | Clears disk artifacts for given session. |

---

### 4.2 Endpoint Data Contracts

#### 1. Upload Ingestion: `POST /api/upload`
- **Request:** Multi-part form with `image` file field.
- **Validation:**
  - Allowed extensions: `.jpg`, `.jpeg`, `.png`, `.webp`.
  - Content length: $\le 10$ MB.
  - Image decoding verification via `cv2.imdecode`.
  - Dimension constraints: Min $300 \times 300$, Max $3840 \times 2160$.
- **Response (201 Created):**
```json
{
  "success": true,
  "session_id": "8f3e2b9c-4821-4cf1-97b0-13f59e0a8412",
  "filename": "portrait.jpg",
  "dimensions": {
    "width": 1080,
    "height": 1440,
    "channels": 3
  },
  "preview_url": "/api/artifacts/8f3e2b9c-4821-4cf1-97b0-13f59e0a8412/original"
}
```

#### 2. Pipeline Execution: `POST /api/process`
- **Request Body (`application/json`):**
```json
{
  "session_id": "8f3e2b9c-4821-4cf1-97b0-13f59e0a8412",
  "garment_id": "tshirt_black_crew",
  "fine_tune": {
    "offset_x": 0,
    "offset_y": 0,
    "scale_factor": 1.0
  }
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "session_id": "8f3e2b9c-4821-4cf1-97b0-13f59e0a8412",
  "garment_id": "tshirt_black_crew",
  "execution_time_ms": 342,
  "detected_anchors": {
    "left_shoulder": [340, 410],
    "right_shoulder": [740, 415],
    "neck_center": [540, 380],
    "torso_bottom": [540, 960]
  },
  "composite_url": "/api/artifacts/8f3e2b9c-4821-4cf1-97b0-13f59e0a8412/composite",
  "stages": [
    {"name": "original", "title": "Source Portrait", "url": "/api/artifacts/8f3e.../original"},
    {"name": "grayscale", "title": "Grayscale Luminance", "url": "/api/artifacts/8f3e.../grayscale"},
    {"name": "hsv_mask", "title": "HSV Color Segmentation", "url": "/api/artifacts/8f3e.../hsv_mask"},
    {"name": "morph_mask", "title": "Morphologically Cleaned Mask", "url": "/api/artifacts/8f3e.../morph_mask"},
    {"name": "canny_edges", "title": "Canny Edge Detection", "url": "/api/artifacts/8f3e.../canny_edges"},
    {"name": "contours_anchors", "title": "Body Contours & Anchors", "url": "/api/artifacts/8f3e.../contours_anchors"},
    {"name": "warped_garment", "title": "Affine Warped Garment", "url": "/api/artifacts/8f3e.../warped_garment"},
    {"name": "composite", "title": "Alpha Feathered Composite", "url": "/api/artifacts/8f3e.../composite"}
  ]
}
```

---

## 5. Processing Engine Technical Specification

### 5.1 Reusing Existing Baseline Modules
The existing baseline `src/processing/filters.py` provides:
- `rgb_to_grayscale(image)`: Validated luminance conversion using ITU-R BT.601 coefficients.
- `apply_gaussian_blur(image, kernel_size, sigma_x)`: Spatial filtering using $5 \times 5$ Gaussian kernel.
- `canny_edge_detection(image, threshold1, threshold2)`: Boundary extraction.

These functions will be retained **unmodified** and utilized directly as the first stage of the web pipeline.

### 5.2 Segmentation Module (`src/processing/segmentation.py`)
- **RGB to HSV Conversion:**
  ```python
  hsv = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2HSV)
  ```
- **Skin and Background Segmentation:**
  - Decouples chromaticity $(H, S)$ from light intensity $(V)$.
  - Configurable HSV threshold bounds for skin color isolation (e.g., Lower: $[0, 20, 70]$, Upper: $[20, 255, 255]$).
  - Background subtraction using Otsu's thresholding or background color variance on peripheral image margins.

### 5.3 Feature & Contour Analysis (`src/processing/features.py`)
- **Morphological Operations:**
  - Morphological Opening (`cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)` with $5 \times 5$ elliptical kernel) to remove isolated hair strands and background noise.
  - Morphological Closing (`cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)` with $9 \times 9$ rectangular kernel) to bridge internal gaps within the body silhouette.
- **Contour Hierarchy & Moments:**
  - `cv2.findContours(cleaned_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)` selects the largest connected silhouette representing the subject.
  - Horizontal scanline analysis computes the width profile across the upper 30% to 70% of the detected silhouette to locate maximum width inflection (shoulders) and minimum upper inflection (neck base).

### 5.4 2D Affine Transformation (`src/processing/transform.py`)
- **3-Point Affine Mapping:**
  - Let source garment anchor points be:
    $$P_{\text{src}} = \begin{bmatrix} X_{ls}^{\text{garment}} & Y_{ls}^{\text{garment}} \\ X_{rs}^{\text{garment}} & Y_{rs}^{\text{garment}} \\ X_{tb}^{\text{garment}} & Y_{tb}^{\text{garment}} \end{bmatrix}$$
  - Let target body anchor points be:
    $$P_{\text{dst}} = \begin{bmatrix} X_{ls}^{\text{body}} & Y_{ls}^{\text{body}} \\ X_{rs}^{\text{body}} & Y_{rs}^{\text{body}} \\ X_{tb}^{\text{body}} & Y_{tb}^{\text{body}} \end{bmatrix}$$
  - Compute affine matrix $M = \text{cv2.getAffineTransform}(P_{\text{src}}, P_{\text{dst}})$, where $M \in \mathbb{R}^{2 \times 3}$.
  - Warp the 4-channel garment RGBA matrix:
    ```python
    warped_garment = cv2.warpAffine(
        garment_rgba, M, (target_w, target_h),
        flags=cv2.INTER_LINEAR,
        borderMode=cv2.BORDER_CONSTANT,
        borderValue=(0, 0, 0, 0)
    )
    ```

### 5.5 Alpha Compositing & Feathering (`src/processing/compositing.py`)
- **Alpha Mask Extraction & Feathering:**
  - Extract the alpha channel $\alpha_{\text{raw}} = \text{warped\_garment}[:, :, 3]$.
  - Normalize to float range $[0.0, 1.0]$.
  - Apply Gaussian spatial smoothing: $\alpha_{\text{feathered}} = \text{cv2.GaussianBlur}(\alpha_{\text{norm}}, (5, 5), 1.2)$ to prevent aliased jagged transitions.
- **Linear Convex Blending:**
  ```python
  for c in range(3): # BGR channels
      composite[:, :, c] = (
          alpha_feathered * warped_garment[:, :, c] +
          (1.0 - alpha_feathered) * target_image[:, :, c]
      ).astype(np.uint8)
  ```
- **Illumination Adjustment:**
  - Calculate average luminance $V_{\text{target}}$ of the subject's upper chest region and $V_{\text{garment}}$ of the garment.
  - Scale garment RGB values by $\gamma = \text{clip}(V_{\text{target}} / V_{\text{garment}}, 0.8, 1.2)$ for natural lighting coherence.

---

## 6. Temporary File & Session Management

To keep the system lightweight and avoid requiring a database:
1. Every upload generates an isolated UUID4 session string: `temp/sessions/<session_id>/`.
2. Intermediate matrices are written to disk as PNG files within the session folder (`original.png`, `grayscale.png`, `hsv_mask.png`, `morph_mask.png`, `canny_edges.png`, `contours_anchors.png`, `warped_garment.png`, `composite.png`).
3. An automated background cleanup utility removes session directories older than 60 minutes.
4. Client can explicitly trigger `POST /api/reset/<session_id>` when navigating away.

---

## 7. Error Handling & Validation Matrix

| Failure Mode | Detection Point | HTTP Code | Response Action |
| :--- | :--- | :--- | :--- |
| Unsupported file extension | Route header check | 415 Unsupported Media Type | Return `"Only PNG, JPG, and WEBP files are supported."` |
| File size $> 10$ MB | Flask content length limit | 413 Payload Too Large | Return `"Image exceeds maximum 10MB limit."` |
| Corrupt or unparseable image | `cv2.imdecode` returns `None` | 422 Unprocessable Entity | Return `"Corrupt or unreadable image file."` |
| Image dimensions $< 300 \times 300$ | Shape inspection | 400 Bad Request | Return `"Image is too small. Minimum dimensions: 300x300 px."` |
| No prominent subject detected | Contour area $< 5\%$ of image | 422 Unprocessable Entity | Return `"Subject silhouette could not be isolated. Use a clearer portrait."` |
| Invalid garment ID | Catalog lookup | 404 Not Found | Return `"Selected garment does not exist in catalog."` |
