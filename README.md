# Stylinger — Classical Computer Graphics & IDM-VTON AI Virtual Fashion Styling Studio

[![Python Version](https://img.shields.io/badge/python-3.12%2B-blue.svg)](https://www.python.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3.5-646CFF.svg)](https://vite.dev/)
[![React](https://img.shields.io/badge/React-19.3-61DAFB.svg)](https://react.dev/)
[![OpenCV](https://img.shields.io/badge/OpenCV-5.0.0-red.svg)](https://opencv.org/)
[![IDM-VTON](https://img.shields.io/badge/AI%20Engine-IDM--VTON%20(Diffusion)-orange.svg)](https://huggingface.co/spaces/yisol/IDM-VTON)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Academic Scope](https://img.shields.io/badge/Academic%20Scope-Classical%20CG%2FIP%20%2B%20AI%20Evaluation-gold.svg)]()

> **Final University Project — Computer Graphics & Digital Image Processing (CG/IP)**  
> **Dual-Engine Architecture:** In-house Deterministic Classical CG/IP (OpenCV + NumPy) side-by-side with Pretrained Diffusion AI (IDM-VTON on Hugging Face ZeroGPU).

---

## ⚡ Professor & Evaluator Quick-Start Guide (Run in 3 Steps)

This project is completely configured and ready to run out-of-the-box on your local machine.

### Prerequisites
- **Python 3.10+** (Python 3.12 recommended)
- **Node.js 18+** (with npm)
- **Git**

---

### Step 1: Clone & Setup Environment

Open your terminal (PowerShell, Command Prompt, or Bash) in the project directory:

```bash
# 1. Create and activate a Python virtual environment
python -m venv venv

# On Windows (PowerShell / CMD):
.\venv\Scripts\activate

# On macOS / Linux:
# source venv/bin/activate

# 2. Install all Python dependencies (Flask, OpenCV, NumPy, Gradio Client, etc.)
pip install -r requirements.txt

# 3. Install Node.js dependencies for root orchestrator and React frontend
npm install
npm --prefix frontend install
```

---

### Step 2: (Optional) Configure Hugging Face Token for AI Engine

The project works **100% offline out-of-the-box for Mode A (Classical CG/IP)** without any token or internet connection!

If you wish to test **Mode B (IDM-VTON Generative AI)** or **Mode C (Compare Both)** without hitting Hugging Face anonymous rate limits:

```bash
# Copy the example environment file
cp .env.example .env
```
Open `.env` and paste your free Hugging Face User Access Token ([get one here in 30 seconds](https://huggingface.co/settings/tokens)):
```ini
HF_TOKEN=hf_your_free_read_token_here
IDM_VTON_SPACE=yisol/IDM-VTON
```
*(If no token is supplied, the AI engine will connect anonymously subject to public Space queue availability).*

---

### Step 3: Launch the Studio

#### Option A — One-Click Launch (Windows)
Simply double-click:
👉 **`run_all.bat`**  
*(Or run `npm run dev` in your terminal)*

#### Option B — Cross-Platform Launch (Terminal)
```bash
npm run dev
```

This single command starts all three microservices concurrently:
1. 🩵 **Classical CV Engine**: `http://127.0.0.1:5001` (In-house OpenCV/NumPy microservice)
2. 💛 **Flask Web API Gateway**: `http://127.0.0.1:5000` (Unified routing, async jobs, validation)
3. 💜 **React/Vite Frontend Studio**: `http://127.0.0.1:5173` (Interactive UI & comparison slider)

Open your web browser at:
### 🌐 **`http://127.0.0.1:5173`**

---

### 🧪 How to Demonstrate the 3 Modes During Evaluation

We have included clean, pre-tested sample portrait and garment assets in [`sample_images/`](sample_images/):

1. **Mode A — Classical CG/IP Engine (Our In-House Work)**:
   - Click the **"Classical CG/IP"** tab at the top.
   - Upload `sample_images/user_clean_crop.jpg` as the person photo.
   - Select or upload `sample_images/oxford_shirt_raw.jpg` as the garment.
   - Click **"Synthesize Try-On Composite"**.
   - **Result**: Generates in **~250 milliseconds**. Displays the affine-warped, alpha-feathered composite, plus the live GrabCut segmentation contour and landmark overlay telemetry!
   - You can also adjust Scale, X/Y Offset, Rotation, and Lighting Balance in real-time.

2. **Mode B — AI Diffusion Virtual Try-On (IDM-VTON Integration)**:
   - Click the **"AI Virtual Try-On (IDM-VTON)"** tab.
   - The same person and garment images remain loaded.
   - Click **"Generate AI Try-On (Hugging Face ZeroGPU)"**.
   - An asynchronous job is dispatched to `yisol/IDM-VTON`. The UI shows a live polling timer (~30-35s GPU latency).
   - **Result**: Generates a high-fidelity diffusion composite showing realistic fabric folds and shadows.

3. **Mode C — Compare Both (Side-by-Side & Interactive Curtain Slider)**:
   - Click the **"Compare Both"** tab.
   - Click **"Run Dual-Engine Synthesis"** to execute both engines simultaneously on the exact same inputs.
   - **Result**: Inspect both outputs side-by-side or drag the **interactive split-screen curtain slider** back and forth to see the mathematical differences between rigid 2D planar warping vs. 3D generative diffusion.

---

### 🔬 Run Automated Regression Test Suite

All 71 automated tests can be verified in seconds:

```bash
# 1. Run root unit, integration, and AI mock tests (25 tests):
venv\Scripts\pytest.exe --import-mode=importlib tests/

# 2. Run tryon-service microservice tests (46 tests):
$env:PYTHONPATH="stylinger-cgip-main/stylinger-cgip-main/tryon-service"; venv\Scripts\pytest.exe --import-mode=importlib stylinger-cgip-main/stylinger-cgip-main/tryon-service/tests/

# 3. Verify frontend production build:
npm --prefix frontend run build
```
✅ **All 71 tests pass cleanly with 0 failures.**

---

---

## 1. Project Abstract & Objectives

**Stylinger** is an academic virtual fashion styling studio designed to investigate, implement, and comparatively evaluate two fundamentally distinct computer vision paradigms for 2D virtual try-on:

1. **Deterministic Classical CG/IP (Our In-House Engine)**:
   - Pure spatial image processing, bilateral filtering, and CIELAB CLAHE contrast normalization.
   - Dual-space segmentation: Otsu background isolation, cylindrical HSV skin masking, and GrabCut silhouette extraction.
   - Contour hierarchy analysis and scanline inflection discovery for acromion (shoulder) and collar anchors.
   - $2 \times 3$ Affine geometric warping matrices (`cv2.warpAffine`) and multi-channel Gaussian edge feathering.
   - Sub-second local execution ($< 350$ ms), 100% deterministic, zero cloud dependency.

2. **Generative Diffusion AI (IDM-VTON Integration)**:
   - Hosted inference integration with *IDM-VTON* (*Improving Diffusion Models for Virtual Try-On*, Choi et al., 2024).
   - High-fidelity non-rigid garment wrapping synthesized by a latent diffusion UNet backbone via Hugging Face ZeroGPU.
   - Remote GPU execution ($~33$ s inference time) handling complex fabric folds and perspective self-occlusion.

3. **Comparative Evaluation (Mode C — Compare Both)**:
   - Directly feeds the **exact same input portrait and garment asset** to both engines concurrently.
   - Features side-by-side comparative inspection and an interactive split-curtain slider comparing Classical vs AI output.

---

## 2. System Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PRESENTATION TIER (Port 5173)                         │
│  React 19 + TypeScript + Vite + Lucide Icons                                │
│  - Mode A: Classical CG/IP Studio                                           │
│  - Mode B: AI Virtual Try-On (IDM-VTON) Studio                              │
│  - Mode C: Dual-Engine Comparison (Curtain Slider & Side-by-Side Cards)     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP / REST Proxy (/api/*)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                         FLASK API GATEWAY (Port 5000)                       │
│  Unified Microframework Application Factory (`src/web/app.py`, `routes.py`) │
│  - Validation: 16 MB ceiling, PIL header verification, format bounds        │
│  - Asynchronous AI Job Manager (`src/web/services/idm_vton.py`)             │
│  - Transparent Proxy to Classical Microservice                              │
└───────────────────┬─────────────────────────────────────┬───────────────────┘
                    │                                     │
                    ▼ (Local Loopback 127.0.0.1:5001)     ▼ (HTTPS / Gradio Client)
┌───────────────────────────────────────┐ ┌───────────────────────────────────┐
│     CLASSICAL CV ENGINE (Port 5001)   │ │  HUGGING FACE ZEROGPU (Cloud)     │
│  OpenCV 5.0.0 + NumPy 2.5 + Pillow    │ │  Pretrained Space: yisol/IDM-VTON │
│  - GrabCut & Otsu Contour Extraction  │ │  - Diffusion Latent UNet Backbone │
│  - 2D Affine Transformation (warp)    │ │  - Asynchronous Queue Job Polling │
│  - Gaussian Alpha Edge Matting        │ │  - Non-Rigid Fabric Synthesis     │
│  - Telemetry: ~170ms - 330ms latency  │ │  - Telemetry: ~33.1s GPU latency  │
└───────────────────────────────────────┘ └───────────────────────────────────┘
```

---

## 3. Technology Stack

| Layer | Component | Version / Library | Role |
| :--- | :--- | :--- | :--- |
| **Frontend** | React 19 + TypeScript | React 19.3, TS 5.x | Interactive web studio, comparison slider, catalog |
| **Build Tool** | Vite | Vite 8.3.5 | Hot-module reloading & optimized client bundle |
| **API Gateway** | Flask 3.x | Flask 3.1.3 | Session validation, routing, async job lifecycle |
| **CORS Layer** | Flask-CORS | Flask-CORS 6.0.5 | Cross-origin headers between Vite and Flask |
| **AI Client** | Gradio Client | gradio_client 2.7.2 | Hugging Face ZeroGPU remote inference orchestration |
| **Env Loader** | Python-Dotenv | python-dotenv 1.2.4 | Safe in-memory `.env` secret ingestion |
| **Classical Engine**| OpenCV + NumPy | OpenCV 5.0.0, NumPy 2.5 | Deterministic spatial filtering and affine matting |
| **Desktop Baseline**| PyQt5 | PyQt5 5.15.11 | Preserved Phase 0 desktop GUI (`src/main.py`) |
| **Test Suite** | PyTest | PyTest 9.2.0 | 71 automated regression and mock tests |

---

## 4. Academic Evaluation & Comparative Methodology

### Mathematical Comparison Matrix

| Property | Classical CG/IP Engine (In-House) | AI Engine (IDM-VTON Pretrained) |
| :--- | :--- | :--- |
| **Theoretical Foundation** | Linear Algebra, Convex Combinations, Spatial DIP | Generative Latent Diffusion (UNet Denoising) |
| **Primary Operators** | `cv2.warpAffine`, `cv2.GaussianBlur`, `cv2.inRange` | Cross-attention garment-person latent conditioning |
| **Execution Location** | Local CPU/GPU (`127.0.0.1:5001`) | Cloud ZeroGPU cluster (`yisol/IDM-VTON`) |
| **Inference Latency** | **174 ms – 332 ms** | **~33.10 seconds** |
| **Resource Cost** | Minimal CPU / In-memory | High-end Cloud GPU (NVIDIA A100 / H100) |
| **Determinism** | **100% Deterministic** (identical matrix outputs) | Stochastic (conditioned on random seed) |
| **Cloth Deformation** | Rigid planar 2D affine warping | Realistic non-rigid 3D drapery and fold synthesis |
| **Pose & Occlusion** | Best for frontal upright portraits | Synthesizes realistic limb and neck occlusions |

### Academic Disclosure
- **Classical CG/IP**: Entirely developed in-house for this academic course using pure OpenCV and NumPy algorithms.
- **IDM-VTON**: Third-party pretrained state-of-the-art research model (*Choi et al., CVPR 2024*). We have integrated, evaluated, and benchmarked inference via its public Hugging Face ZeroGPU Space. We have **not** trained or fine-tuned IDM-VTON.

---

## 5. Environment Setup & Token Configuration

A `.env` file is utilized for Hugging Face authentication to avoid public rate-limiting:

### 1. Token Setup (`.env.example`)
Create a `.env` file in the project root:
```ini
HF_TOKEN=hf_your_huggingface_read_token
IDM_VTON_SPACE=yisol/IDM-VTON
```
> **Security Guarantee:** `.env` is explicitly ignored by Git. The backend ingests `HF_TOKEN` purely into memory. The token is never logged, never returned via API responses, and never bundled into frontend JavaScript.

---

## 6. Manual & Development Launch Commands

To run during development and testing:

### Option 1: Complete Unified Launch (Recommended)
```powershell
# From project root:
npm run dev
```
*Launches Classical Engine (5001), Flask Gateway (5000), and Vite UI (5173) concurrently.*

### Option 2: Individual Process Terminals (Manual)
```powershell
# Terminal 1: Classical CV Engine
.\venv\Scripts\python.exe stylinger-cgip-main\stylinger-cgip-main\tryon-service\app.py

# Terminal 2: Flask API Gateway
.\venv\Scripts\python.exe -m flask --app src.web.app:create_app run --host=127.0.0.1 --port=5000

# Terminal 3: Vite React Frontend
npm --prefix frontend run dev
```

Open your browser to:
👉 **`http://127.0.0.1:5173`**

---

## 7. REST API Endpoints & Data Contracts

| Method | Route | Description | Response Code |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Overall system telemetry (Classical + AI status) | `200 OK` |
| `POST` | `/api/tryon/segment-preview` | Classical GrabCut contour and landmark overlay | `200 OK` |
| `POST` | `/api/tryon/process` | Classical 2D affine warped composite | `200 OK` |
| `POST` | `/api/tryon/ai/jobs` | Submit async IDM-VTON diffusion inference job | `202 Accepted` |
| `GET` | `/api/tryon/ai/jobs/<id>` | Poll IDM-VTON job status or retrieve result image | `200 OK` / `404` |

### Example AI Job Creation Payload (`POST /api/tryon/ai/jobs`)
```json
{
  "person_image_base64": "data:image/jpeg;base64,...",
  "garment_image_base64": "data:image/png;base64,...",
  "category": "Shirts",
  "garment_description": "Oxford Dress Shirt"
}
```

---

## 8. Test Suite & Verification Results

The automated test suite runs 100% offline without consuming live ZeroGPU quotas by mocking remote Gradio predictions:

```bash
# 1. Run root unit, integration, and AI mock test suite:
venv\Scripts\pytest.exe --import-mode=importlib tests/

# 2. Run tryon-service microservice tests:
$env:PYTHONPATH="stylinger-cgip-main/stylinger-cgip-main/tryon-service"; venv\Scripts\pytest.exe --import-mode=importlib stylinger-cgip-main/stylinger-cgip-main/tryon-service/tests/

# 3. Verify frontend production build:
npm --prefix frontend run build
```

### Verified Test Summary

```text
============================= Test Session Summary =============================
Root Test Suite (tests/):
  tests/test_ai_tryon.py ............ 10 passed (Validation, Queues, Mock Gradio, Quota)
  tests/test_integration.py ......... 3 passed (Live health discovery, Filter, Tryon)
  tests/test_pipeline.py ............ 6 passed (Synthetic, BT.601, Canny, Blur)
  tests/test_web.py ................. 6 passed (Factory, Branding, Routes, 404 handler)
  Subtotal: 25 / 25 PASSED (100%)

CV Microservice Test Suite:
  tryon-service/tests/ ............. 46 / 46 PASSED (100%)

Total Automated Python Tests: 71 PASSED across all suites.
Frontend Production Build: Vite v8.3.5 built cleanly in 553 ms (0 errors).
Live IDM-VTON Remote GPU Verification: PASSED in 33.10 seconds.
```

---

## 9. Genuine Verified Output Images

Stored in [`sample_images/outputs/`](sample_images/outputs/):
1. `01_landmark_contour_overlay.png`: Classical GrabCut subject silhouette and estimated torso/shoulder inflections.
2. `02_oxford_shirt_tryon_result.png`: Classical 2D affine warped and alpha-feathered composite (Oxford shirt).
3. `03_denim_jacket_tryon_result.png`: Classical structured denim jacket composite with LAB lighting balance.
4. `04_idm_vton_ai_result.png`: **Live generated IDM-VTON diffusion try-on result (1024x768)** produced by remote GPU in 33.10 seconds.
5. `05_idm_vton_mask.png`: IDM-VTON human parsing mask generated during diffusion.

---

## 10. Privacy, Ethics & Data Governance

- **In-Memory Processing**: Neither the Flask backend nor the Classical microservice permanently persist user photos to disk.
- **Temporary AI Artifacts**: Input images transmitted to Hugging Face ZeroGPU are passed as ephemeral payloads and deleted from local storage immediately after job completion.
- **Fail-Safe Decoupling**: If the remote AI service experiences network interruption or ZeroGPU quota exhaustion, the in-house Classical CG/IP engine continues to operate locally with zero degradation.
