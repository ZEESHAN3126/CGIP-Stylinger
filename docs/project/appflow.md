# Stylinger — Application & Processing Flow (appflow.md)

**Document Status:** Approved Operational Flow  
**Project:** Stylinger — Virtual Fashion Styling using Computer Graphics and Image Processing  
**Milestone:** End-to-End User & Pipeline Workflow Specification  

---

## 1. Flow Diagram Overview

```text
 [1. Landing & Upload] ───────────────> [2. Image Validation]
           │                                      │
           ▼                                      ▼
 [3. Image Preprocessing] ────────────> [4. RGB → HSV Color Conversion]
           │                                      │
           ▼                                      ▼
 [5. Background Segmentation] ────────> [6. Morphological Cleanup]
           │                                      │
           ▼                                      ▼
 [7. Canny & Contour Detection] ──────> [8. Body-Region Estimation]
           │                                      │
           ▼                                      ▼
 [9. Garment Selection] ──────────────> [10. Garment Preprocessing]
           │                                      │
           ▼                                      ▼
 [11. 2D Affine Transformation] ──────> [12. Alpha Blending & Compositing]
           │                                      │
           ▼                                      ▼
 [13. Outfit Visualization] ──────────> [14. Interactive Comparison]
           │
           ▼
 [15. Export & Download]
```

---

## 2. Stage-by-Stage Detailed Specification

---

### Stage 1: Landing & Upload
- **Input:** User initiates action via browser file picker dialog or drag-and-drop onto the drop zone.
- **Processing:** Client-side event listener (`dragover`, `drop`, `change`) extracts `File` object; verifies mime-type and file size (< 10 MB).
- **Output:** Raw binary payload packaged into `FormData` with key `image`.
- **What the User Sees:** A minimalist luxury upload zone with an animated dashed perimeter, "Drag & drop portrait or browse" typography, format badges (PNG, JPG, WEBP), and an instant thumbnail preview upon file selection.
- **What Can Fail:**
  - File exceeds 10 MB: UI immediately flags error toast without making network request.
  - Non-image file dropped (e.g. PDF): Drop rejected with visual shake animation.

---

### Stage 2: Image Validation & Ingestion
- **Input:** Multipart HTTP request arriving at `POST /api/upload`.
- **Processing:**
  - Filename sanitized using `secure_filename()`.
  - Byte array decoded into BGR NumPy matrix via `cv2.imdecode()`.
  - Matrix validity check: `image is not None`, `image.size > 0`, `len(image.shape) == 3`.
  - Aspect ratio and resolution verification: minimum $300 \times 300$ px, maximum $3840 \times 2160$ px.
  - Unique UUID4 session directory instantiated (`temp/sessions/<session_id>/`).
- **Output:** Cleaned BGR image matrix saved as `original.png` in session directory; JSON response containing `session_id`, image width, height, and preview URL.
- **What the User Sees:** Subtle progress indicator transitioning the UI into "Active Workspace" mode, displaying the uploaded portrait framed in a 3:4 aspect ratio fashion canvas.
- **What Can Fail:**
  - Corrupted image bytes causing `cv2.imdecode` to return `None`: Returns HTTP 422 with message "Corrupted image file".
  - Extremely small resolution: Returns HTTP 400 with message "Image resolution too low (< 300x300)".

---

### Stage 3: Image Preprocessing
- **Input:** Raw BGR image matrix $(H \times W \times 3)$, `dtype=uint8`.
- **Processing:**
  - High-resolution images are scaled to a standardized working resolution (e.g., height normalized to 1200 px while preserving aspect ratio) using bilinear interpolation (`cv2.INTER_LINEAR`).
  - Spatial noise reduction: Apply edge-preserving bilateral filter (`cv2.bilateralFilter(img, d=9, sigmaColor=75, sigmaSpace=75)`) or $5 \times 5$ Gaussian smoothing filter (`apply_gaussian_blur()`).
- **Output:** Denoised working BGR matrix $(H_w \times W_w \times 3)$.
- **What the User Sees:** Status pill shows "Preprocessing image: Denoising & spatial calibration...".
- **What Can Fail:**
  - Memory allocation error on abnormally massive images: Handled by defensive resolution clamping.

---

### Stage 4: RGB → HSV Color Conversion
- **Input:** Standardized BGR image matrix.
- **Processing:**
  - Transform color space from BGR to HSV using standard cylindrical coordinates via `cv2.cvtColor(bgr_img, cv2.COLOR_BGR2HSV)`.
  - Decouple chromatic components (Hue $H \in [0, 179]$, Saturation $S \in [0, 255]$) from achromatic intensity (Value $V \in [0, 255]$).
- **Output:** 3-channel HSV matrix $(H_w \times W_w \times 3)$, `dtype=uint8`.
- **What the User Sees:** User can toggle "Pipeline Inspector" to see the intermediate HSV false-color representation.
- **What Can Fail:**
  - Matrix channel mismatch: Caught by pre-conversion channel assertion.

---

### Stage 5: Background & Skin Segmentation
- **Input:** 3-channel HSV matrix.
- **Processing:**
  - Apply dual HSV thresholding:
    1. Skin chromaticity mask: `cv2.inRange(hsv, lower_skin, upper_skin)` where typical range is $H \in [0, 25]$, $S \in [30, 200]$, $V \in [60, 255]$.
    2. Background color variance estimation: Sample border margins to identify dominant background HSV cluster and threshold its inverse.
  - Combine threshold responses using bitwise operations (`cv2.bitwise_or`, `cv2.bitwise_and`) to produce binary subject mask.
- **Output:** Raw binary segmentation mask $(H_w \times W_w)$, `dtype=uint8` ($0 = \text{background}$, $255 = \text{subject}$).
- **What the User Sees:** Stepper advances to "Segmentation: Subject isolation complete".
- **What Can Fail:**
  - Low contrast between background and subject (e.g., white shirt on white wall): Produces noisy segmentation mask; mitigated by fallback Otsu thresholding on grayscale channel.

---

### Stage 6: Morphological Cleanup
- **Input:** Raw binary segmentation mask from Stage 5.
- **Processing:**
  - Apply Morphological Opening (`cv2.morphologyEx` with `cv2.MORPH_OPEN` using $5 \times 5$ elliptical structuring element) to eliminate small isolated noise clusters and stray background pixels.
  - Apply Morphological Closing (`cv2.morphologyEx` with `cv2.MORPH_CLOSE` using $9 \times 9$ rectangular structuring element) to bridge internal gaps, small holes, and hollow regions within the clothing/torso silhouette.
  - Subtle Dilation (`cv2.dilate` with $3 \times 3$ kernel, 1 iteration) to ensure continuous perimeter.
- **Output:** Cleaned solid binary mask `morph_mask.png` $(H_w \times W_w)$, `dtype=uint8`.
- **What the User Sees:** In Pipeline Inspector, the mask appears solid, continuous, and free of salt-and-pepper noise.
- **What Can Fail:**
  - Over-erosion causing body extremities (hands/ears) to detach: Structuring element size bounded relative to working resolution.

---

### Stage 7: Canny Edge & Contour Detection
- **Input:** Cleaned binary mask and preprocessed grayscale image.
- **Processing:**
  - Execute multi-stage Canny Edge Detection (`cv2.Canny(gray, threshold1=50, threshold2=150)`) to extract crisp physical boundaries.
  - Extract topological external contours using `cv2.findContours(morph_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)`.
  - Filter contours by area: select the dominant contour $C_{\text{max}} = \arg\max \text{cv2.contourArea}(C)$.
- **Output:** Dominant contour vector, bounding rectangle $(x, y, w, h)$, and binary Canny edge map `canny_edges.png`.
- **What the User Sees:** Edge boundary overlay glowing subtly on the canvas during inspection mode.
- **What Can Fail:**
  - No contours found (blank image): Triggers fallback warning asking user to upload a portrait with distinct subject.

---

### Stage 8: Body-Region Estimation (Torso & Shoulders)
- **Input:** Dominant contour $C_{\text{max}}$, bounding rectangle, and silhouette mask.
- **Processing:**
  - Compute spatial moments (`cv2.moments`) to establish horizontal centroid $C_x$.
  - Perform horizontal scanline density profiling across vertical slices from $y = 0.15 \times h$ to $y = 0.55 \times h$:
    - Find the local maximum width span corresponding to the shoulder line.
    - Left shoulder anchor $P_{ls} = (X_{ls}, Y_s)$ and Right shoulder anchor $P_{rs} = (X_{rs}, Y_s)$.
    - Estimate neck base $P_n = (C_x, Y_s - \Delta y_{\text{neck}})$.
    - Estimate torso hemline baseline $P_b = (C_x, Y_s + 1.4 \times \text{shoulder\_width})$.
- **Output:** Coordinate set: $P_{\text{anchors}} = \{ P_{ls}, P_{rs}, P_n, P_b \}$, saved as `contours_anchors.png`.
- **What the User Sees:** Subtle glowing geometric guide points briefly illuminate on the subject's shoulders and torso center.
- **What Can Fail:**
  - Asymmetric pose or angled body: Centroid and horizontal width inflection adaptively calculate per scanline; fallback uses proportional bounding box heuristics ($0.25 \times w$ and $0.75 \times w$ at $0.25 \times h$).

---

### Stage 9: Garment Selection
- **Input:** User clicks on a garment card from the catalog drawer/carousel.
- **Processing:**
  - Client retrieves garment metadata from `assets/garments/garments.json` (ID, name, category, default anchor points, native dimensions).
  - Selected state stored in client application state (`currentGarmentId`).
- **Output:** Garment selection event payload sent to backend via `POST /api/process`.
- **What the User Sees:** The selected garment card highlights with a refined active border (Liquid Gold `#D4AF37`) and an active check badge; a high-res preview floats into view.
- **What Can Fail:**
  - Network timeout while fetching asset: Cached in browser memory after initial load.

---

### Stage 10: Garment Preprocessing
- **Input:** 4-channel RGBA garment image file (`tshirt_black_crew.png`), shape $(H_g \times W_g \times 4)$.
- **Processing:**
  - Split channels into color $(B, G, R)$ and alpha channel $A$.
  - Verify alpha channel contains non-zero transparency values.
  - Retrieve native garment anchor points: $P_{\text{garment\_ls}}$, $P_{\text{garment\_rs}}$, $P_{\text{garment\_hem}}$.
- **Output:** Separated BGR garment matrix and normalized alpha mask $A_g \in [0.0, 1.0]$.
- **What the User Sees:** Instant background processing; spinner activates on canvas.
- **What Can Fail:**
  - Missing alpha channel (3-channel JPG accidentally placed in catalog): System automatically generates alpha mask from white background threshold.

---

### Stage 11: 2D Affine / Perspective Transformation
- **Input:** Source garment anchors $(P_{ls}^g, P_{rs}^g, P_b^g)$ and target body anchors $(P_{ls}^b, P_{rs}^b, P_b^b)$ with optional user fine-tuning offsets $(\Delta x, \Delta y, \text{scale})$.
- **Processing:**
  - Adjust target anchors with user fine-tune parameters:
    $$\tilde{P}^b = \text{scale} \cdot (P^b - C_{\text{torso}}) + C_{\text{torso}} + (\Delta x, \Delta y)$$
  - Calculate $2 \times 3$ Affine Transformation matrix:
    $$M = \text{cv2.getAffineTransform}(\text{np.float32}(P^g), \text{np.float32}(\tilde{P}^b))$$
  - Warp the 3-channel garment BGR image to the target image dimensions $(H_w, W_w)$ using `cv2.warpAffine(garment_bgr, M, (W_w, H_w), flags=cv2.INTER_LINEAR)`.
  - Warp the 1-channel alpha channel using identical matrix $M$:
    $$A_{\text{warped}} = \text{cv2.warpAffine}(A_g, M, (W_w, H_w), flags=cv2.INTER_LINEAR)$$
- **Output:** Spatially aligned garment matrix $I_{\text{warped}}$ and warped alpha mask $A_{\text{warped}}$, saved as `warped_garment.png`.
- **What the User Sees:** The pipeline stepper marks "Alignment: Affine spatial transformation calibrated".
- **What Can Fail:**
  - Singular matrix (collinear points): Guard checks determinant of source points before calling `getAffineTransform`; falls back to standard scale-and-translate bounding box warp.

---

### Stage 12: Alpha Blending & Compositing
- **Input:** Target subject BGR matrix $I_{\text{subject}}$, warped garment BGR matrix $I_{\text{warped}}$, and warped alpha mask $A_{\text{warped}}$.
- **Processing:**
  - **Edge Feathering:** Convolve the binary alpha mask with a $5 \times 5$ Gaussian kernel $(\sigma = 1.5)$ to soften sharp step-function borders:
    $$\alpha_{\text{feathered}} = \text{cv2.GaussianBlur}(A_{\text{warped}}, (5, 5), 1.5)$$
  - **Luminance Matching:** Measure average brightness of the subject's neck/torso region in HSV $V$-channel; adjust garment brightness factor $\kappa \in [0.85, 1.15]$ to harmonize lighting conditions.
  - **Linear Convex Combination:** For each color channel $c \in \{B, G, R\}$:
    $$I_{\text{composite}}(x, y, c) = \alpha_{\text{feathered}}(x, y) \cdot I_{\text{warped}}(x, y, c) + (1.0 - \alpha_{\text{feathered}}(x, y)) \cdot I_{\text{subject}}(x, y, c)$$
  - Convert to 8-bit unsigned integer `np.uint8`.
- **Output:** Final composite BGR image matrix $I_{\text{composite}}$, written to `composite.png`.
- **What the User Sees:** The canvas smoothly fades in the styled portrait, showcasing the garment naturally fitted onto the subject.
- **What Can Fail:**
  - Overflow or clipping artifacts: Explicit clamping with `np.clip(..., 0, 255).astype(np.uint8)` guarantees valid 8-bit dynamic range.

---

### Stage 13: Outfit Visualization
- **Input:** Composited image URL and metadata returned by `POST /api/process`.
- **Processing:** DOM renders the composited image onto the main viewport; enables comparison tools, download actions, and fine-tune slider controls.
- **Output:** Interactive visual studio presentation.
- **What the User Sees:** Polished high-resolution rendering with styling stats (garment name, fit accuracy, processing latency in milliseconds).
- **What Can Fail:**
  - Image load latency: Preloaded in memory before switching display.

---

### Stage 14: Interactive Comparison (Before / After Slider)
- **Input:** Original portrait matrix and final styled composite matrix.
- **Processing:**
  - Two overlapping image layers styled with CSS `position: absolute; overflow: hidden;`.
  - Mousemove or touchmove events track cursor position $X_{\text{cursor}}$ across the image container.
  - Top layer clip-path dynamically updated: `clip-path: polygon(0 0, ${percent}% 0, ${percent}% 100%, 0 100%)`.
  - Divider handle synced with percentage position.
- **Output:** Real-time interactive split-screen curtain.
- **What the User Sees:** Dragging the tactile gold divider line smoothly sweeps the new garment on and off the subject, creating an immediate tactile sense of transformation.
- **What Can Fail:**
  - Rapid erratic touch inputs on mobile: Handled with `requestAnimationFrame` throttling.

---

### Stage 15: Export & Download
- **Input:** User clicks "Download Outfit" button.
- **Processing:** Browser triggers download of `/api/download/<session_id>` with header `Content-Disposition: attachment; filename="stylinger_outfit_<timestamp>.png"`.
- **Output:** Lossless PNG file saved to user's local downloads folder.
- **What the User Sees:** Download feedback animation, button state switches to "Downloaded ✓", and prompt to try another garment or restart.
- **What Can Fail:**
  - Expired session directory: Server returns 404 with prompt to re-upload image.
