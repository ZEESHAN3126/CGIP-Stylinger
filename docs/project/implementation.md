# Stylinger — Phased Implementation Roadmap (implementation.md)

**Document Status:** Approved Implementation Plan  
**Project:** Stylinger — Virtual Fashion Styling using Computer Graphics and Image Processing  
**Current Phase:** Phase 0 Completed; Transitioning to Phase 1 Setup  
**Milestone Target:** Full Academic Web Studio Delivery  

---

## 1. Roadmap Architecture

The implementation is partitioned into 14 discrete, test-driven phases (Phase 0 through Phase 13). Each phase builds upon the verified output of the prior stage, preserving backward compatibility with the existing PyQt5 baseline while progressively realizing the web application described in the proposal.

---

## 2. Phase-by-Phase Execution Plan

---

### Phase 0: Baseline Repository & Hello World Pipeline (COMPLETED)
- **Goal:** Establish core repository structure, Git feature branch workflow, non-GUI unit tests, and the initial PyQt5 dual-panel desktop smoke test pipeline.
- **Files Affected:**
  - `src/main.py`
  - `src/gui/main_window.py`
  - `src/processing/filters.py`
  - `src/utils/image_utils.py`
  - `tests/test_pipeline.py`
  - `requirements.txt`, `README.md`, `docs/architecture.md`
- **Dependencies:** Python 3.12, PyQt5, OpenCV, NumPy.
- **Acceptance Criteria:**
  - Synthetic $300 \times 300$ px image generated with text overlay `"CG & IP Pipeline OK"`.
  - Grayscale conversion, Gaussian blurring, and Canny edge detection executed sequentially.
  - PyQt5 window renders side-by-side matrices.
  - Automated smoke tests in `tests/test_pipeline.py` pass with zero failures.
- **Risks & Mitigation:** Linux/macOS headless CI failures avoided by running headless `unittest` without GUI instantiations.

---

### Phase 1: Flask Application Skeleton
- **Goal:** Construct the Flask web application directory structure, route dispatcher, base HTML5 templates, and initial static asset scaffolding without altering desktop GUI files.
- **Files Affected:**
  - `[NEW] src/web/__init__.py`
  - `[NEW] src/web/app.py`
  - `[NEW] src/web/routes.py`
  - `[NEW] src/web/templates/base.html`
  - `[NEW] src/web/templates/index.html`
  - `[NEW] src/web/static/css/variables.css`
  - `[NEW] src/web/static/css/main.css`
  - `[NEW] src/web/static/js/app.js`
  - `[MODIFY] requirements.txt` (Add `flask>=3.0.0`)
- **Dependencies:** Flask, Werkzeug.
- **Acceptance Criteria:**
  - Running `python -m src.web.app` launches web server on `http://127.0.0.1:5000`.
  - Browser displays editorial atelier layout with title, placeholder canvas, and catalog rail.
  - Zero console errors or 404 missing static assets.
  - PyQt5 launcher `python src/main.py` continues to execute independently.
- **Risks:** Port conflicts or circular imports between `src/web` and `src/processing`; mitigated by modular factory pattern.

---

### Phase 2: Real Image Upload & Validation
- **Goal:** Implement secure multipart file upload handling, MIME-type and byte-level validation, image decoding via OpenCV, and UUID-based temporary session directories.
- **Files Affected:**
  - `[NEW] src/utils/file_utils.py` (Session directory lifecycle & cleanup)
  - `[MODIFY] src/web/routes.py` (Implement `POST /api/upload`)
  - `[NEW] src/web/static/js/upload.js` (Drag & drop listener, preview)
  - `[NEW] tests/test_upload.py`
- **Dependencies:** OpenCV (`cv2.imdecode`), Werkzeug (`secure_filename`).
- **Acceptance Criteria:**
  - Valid JPG/PNG uploads return HTTP 201 with `session_id`, dimensions, and image preview.
  - Corrupt or non-image files return HTTP 415/422 with structured JSON error.
  - Session directory created under `temp/sessions/<session_id>/` containing `original.png`.
- **Risks:** Disk accumulation of temporary files; mitigated by session cleanup utility.

---

### Phase 3: Classical Image Preprocessing
- **Goal:** Standardize uploaded image dimensions, reduce sensor noise, and prepare matrices for color and gradient analysis using classical DIP filters.
- **Files Affected:**
  - `[MODIFY] src/processing/filters.py` (Add bilateral filtering and resolution normalization)
  - `[MODIFY] src/web/routes.py` (Integrate preprocessing into upload pipeline)
  - `[MODIFY] tests/test_pipeline.py`
- **Dependencies:** OpenCV (`cv2.resize`, `cv2.bilateralFilter`).
- **Acceptance Criteria:**
  - Images larger than standard bounds are scaled preserving aspect ratio.
  - Spatial noise is smoothed while high-contrast garment and body edges are preserved.
  - Preprocessed image saved as `preprocessed.png`.
- **Risks:** Excessive blurring eroding edge details needed for contouring; mitigated by tuning bilateral filter parameters ($d=9, \sigma_c=75, \sigma_s=75$).

---

### Phase 4: RGB → HSV & Background Segmentation
- **Goal:** Transform preprocessed image into HSV color space and isolate human subject from background using color thresholding and variance masking.
- **Files Affected:**
  - `[NEW] src/processing/segmentation.py`
  - `[MODIFY] src/web/routes.py`
  - `[NEW] tests/test_segmentation.py`
- **Dependencies:** OpenCV (`cv2.cvtColor`, `cv2.inRange`, `cv2.bitwise_or`).
- **Acceptance Criteria:**
  - Generates binary mask $(H \times W)$ differentiating subject pixels from background.
  - HSV false-color representation and raw segmentation mask saved to session directory.
  - Unit tests verify mask dimensions and binary values ($0$ and $255$).
- **Risks:** Variable background hues and lighting; mitigated by combining skin-chroma slicing with Otsu intensity thresholding.

---

### Phase 5: Morphological Cleanup & Contours
- **Goal:** Eliminate segmentation artifacts using mathematical morphology and extract external body contours via multi-stage gradient analysis.
- **Files Affected:**
  - `[NEW] src/processing/features.py` (Morphological opening/closing, Canny, contours)
  - `[MODIFY] src/processing/segmentation.py`
  - `[NEW] tests/test_features.py`
- **Dependencies:** OpenCV (`cv2.morphologyEx`, `cv2.Canny`, `cv2.findContours`).
- **Acceptance Criteria:**
  - Morphological opening removes salt noise; morphological closing seals internal holes.
  - Dominant silhouette contour extracted and bounding box computed.
  - Cleaned mask `morph_mask.png` and edge map `canny_edges.png` generated.
- **Risks:** Disconnected contours due to accessories or skin tones; mitigated by adaptive closing kernel sizes.

---

### Phase 6: Body-Region Estimation (Torso & Shoulders)
- **Goal:** Compute geometric anchor points representing subject shoulders, neck baseline, and torso boundary using classical contour bounding and scanline analysis.
- **Files Affected:**
  - `[MODIFY] src/processing/features.py` (Add `estimate_body_anchors()`)
  - `[MODIFY] tests/test_features.py`
- **Dependencies:** OpenCV, NumPy.
- **Acceptance Criteria:**
  - Returns dictionary of 4 coordinates: `left_shoulder`, `right_shoulder`, `neck_center`, `torso_bottom`.
  - Visual debug matrix `contours_anchors.png` highlights points with green circle markers.
  - Mathematical heuristics prevent anchor collapse if contour is partially occluded.
- **Risks:** Unconventional pose or tilted posture; mitigated by scanline inflection searching and bounding box fallback.

---

### Phase 7: Curated Garment Catalog & RGBA Asset Registry
- **Goal:** Create curated transparent 4-channel RGBA apparel assets and configure JSON registry with native reference anchor points.
- **Files Affected:**
  - `[NEW] assets/garments/garments.json`
  - `[NEW] assets/garments/tshirts/tshirt_black_crew.png`
  - `[NEW] assets/garments/tshirts/tshirt_white_vneck.png`
  - `[NEW] assets/garments/jackets/denim_jacket_blue.png`
  - `[MODIFY] src/web/routes.py` (Implement `GET /api/garments`)
  - `[NEW] src/web/static/js/catalog.js`
- **Dependencies:** Pillow, NumPy.
- **Acceptance Criteria:**
  - All catalog assets are 4-channel PNGs with transparent backgrounds ($A = 0$).
  - `garments.json` defines category, title, file path, and reference coordinates $(x, y)$ for shoulders and hem.
  - Web UI renders responsive garment selection cards.
- **Risks:** Transparency format mismatch; verified by automated asset integrity check.

---

### Phase 8: Garment Preprocessing & Transparency Normalization
- **Goal:** Load garment RGBA matrices, isolate color channels, extract and normalize 8-bit alpha channels, and verify anchor alignment.
- **Files Affected:**
  - `[MODIFY] src/processing/transform.py`
  - `[NEW] src/utils/garment_utils.py`
  - `[NEW] tests/test_garment.py`
- **Dependencies:** OpenCV, NumPy.
- **Acceptance Criteria:**
  - Separates RGB $(H \times W \times 3)$ from Alpha $(H \times W \times 1)$ normalized to float range $[0.0, 1.0]$.
  - Verifies non-zero transparency bounds and bounding box limits.
- **Risks:** Inconsistent image dimensions between catalog assets; handled by normalized coordinate mapping.

---

### Phase 9: 2D Affine / Perspective Transformation Engine
- **Goal:** Mathematically map garment anchor coordinates to the detected subject torso anchors using a $2 \times 3$ Affine Transformation matrix.
- **Files Affected:**
  - `[MODIFY] src/processing/transform.py` (Implement `compute_affine_matrix`, `warp_garment`)
  - `[NEW] tests/test_transform.py`
- **Dependencies:** OpenCV (`cv2.getAffineTransform`, `cv2.warpAffine`).
- **Acceptance Criteria:**
  - Solves for affine matrix $M$ using 3 corresponding anchor pairs.
  - Warps both color matrix and alpha mask to match target image dimensions.
  - Incorporates user fine-tune offsets ($\Delta x, \Delta y, \text{scale}$).
  - Debug artifact `warped_garment.png` written to session folder.
- **Risks:** Collinear points producing singular matrices; mitigated by determinant verification and fallback bounding box scaling.

---

### Phase 10: Multi-Channel Alpha Blending & Feathering
- **Goal:** Composite warped garment onto subject image using Gaussian-feathered alpha masks and local luminance matching.
- **Files Affected:**
  - `[NEW] src/processing/compositing.py`
  - `[NEW] src/processing/pipeline.py` (End-to-end orchestrator)
  - `[NEW] tests/test_compositing.py`
- **Dependencies:** OpenCV, NumPy.
- **Acceptance Criteria:**
  - Applies $5 \times 5$ Gaussian blur to alpha mask edges to prevent hard pixel borders.
  - Performs linear convex combination per channel without integer overflow or color distortion.
  - Harmonizes luminance between subject torso and garment.
  - Generates seamless `composite.png`.
- **Risks:** Halo artifacts around garment perimeter; resolved by subtle alpha erosion prior to feathering.

---

### Phase 11: Interactive Outfit Visualization & Before/After Slider
- **Goal:** Implement the client-side interactive studio with split-screen curtain comparison, stage-by-stage pipeline drawer, and fine-tuning controls.
- **Files Affected:**
  - `[NEW] src/web/static/css/comparison.css`
  - `[NEW] src/web/static/css/pipeline.css`
  - `[NEW] src/web/static/js/slider.js`
  - `[MODIFY] src/web/static/js/app.js`
  - `[MODIFY] src/web/templates/index.html`
- **Dependencies:** Vanilla HTML5, CSS3, ES6+ JS.
- **Acceptance Criteria:**
  - User can drag the gold divider line across the portrait to inspect before and after.
  - Pipeline Inspector displays intermediate debug artifacts with algorithm explanations.
  - Manual adjustment sliders ($\Delta x$, $\Delta y$, scale) re-trigger real-time compositing.
- **Risks:** Event listener lag during rapid slider dragging; mitigated by CSS `transform` and `requestAnimationFrame`.

---

### Phase 12: High-Resolution Export & Download
- **Goal:** Enable users to download the styled composite at full source resolution in lossless PNG or JPEG format.
- **Files Affected:**
  - `[MODIFY] src/web/routes.py` (Implement `GET /api/download/<session_id>`)
  - `[MODIFY] src/web/static/js/app.js`
- **Dependencies:** Flask (`send_file`), OpenCV.
- **Acceptance Criteria:**
  - Clicking "Download Outfit" downloads high-resolution composite.
  - File served with proper MIME type and timestamped filename (`stylinger_outfit_<session_id>.png`).
  - Temporary session can be reset on user request.
- **Risks:** Incomplete image writes before download; mitigated by file flush and existence confirmation.

---

### Phase 13: Comprehensive Testing, Benchmark Profiling & Optimization
- **Goal:** Validate full test suite coverage, measure execution latency benchmarks, audit accessibility (WCAG AA), and verify zero regression on the baseline PyQt5 application.
- **Files Affected:**
  - `[NEW] tests/test_end_to_end.py`
  - `[MODIFY] tests/test_pipeline.py`
  - `[MODIFY] README.md`
- **Dependencies:** Python `unittest`, cProfile.
- **Acceptance Criteria:**
  - All test suites pass 100% in headless execution (`python -m unittest discover tests`).
  - Desktop baseline `python src/main.py` launches and functions flawlessly.
  - Total processing latency $< 1.5$ seconds for standard images.
  - Clean documentation and verification artifacts.
- **Risks:** Memory spikes under concurrent requests; handled by matrix deallocation.
