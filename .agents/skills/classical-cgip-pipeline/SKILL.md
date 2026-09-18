---
name: classical-cgip-pipeline
description: >-
  Authoritative procedural runbook for implementing classical computer vision,
  digital image processing (DIP), and 2D spatial transformations using pure OpenCV,
  NumPy, and Pillow. Strictly deterministic and mathematical; no neural networks or deep learning.
---

# Classical CG/IP Image Processing Pipeline Runbook

This skill is the authoritative implementation guide for the core mathematical and computer vision operators in the Stylinger project. Every operation is deterministic, reproducible, and grounded in digital image processing theory.

## 1. Algorithmic Constraints & Inviolable Rules
- **Pure Classical Operations Only:** Use exclusively OpenCV (`cv2`), NumPy (`np`), and Pillow (`PIL`).
- **NO Deep Learning:** Absolutely zero PyTorch, TensorFlow, Keras, ONNX, YOLO, MediaPipe, or pre-trained weights.
- **Strict Matrix Integrity:** Preserve `dtype=np.uint8` for image display and convert to `np.float32` / `np.float64` only during mathematical operations, clamping back with `np.clip(matrix, 0, 255).astype(np.uint8)`.

---

## 2. Core Mathematical Pipeline Stages

### Stage 2.1: Color Space Transformations
- **RGB / BGR to Grayscale:**
  - Luminance conversion using ITU-R BT.601 weighted coefficients:
    $$Y = 0.299 \cdot R + 0.587 \cdot G + 0.114 \cdot B$$
  - OpenCV: `cv2.cvtColor(bgr_image, cv2.COLOR_BGR2GRAY)`
- **RGB / BGR to HSV (Hue, Saturation, Value):**
  - Decouples chromaticity from illumination intensity:
    - $H \in [0, 179]$: Dominant wavelength (color angle).
    - $S \in [0, 255]$: Purity or saturation of the color.
    - $V \in [0, 255]$: Brightness/luminance.
  - OpenCV: `cv2.cvtColor(bgr_image, cv2.COLOR_BGR2HSV)`

### Stage 2.2: Spatial Domain Filtering & Noise Reduction
- **Gaussian Spatial Blur Filter:**
  - 2D isotropic Gaussian convolution kernel:
    $$G(x, y) = \frac{1}{2\pi\sigma^2} e^{-\frac{x^2 + y^2}{2\sigma^2}}$$
  - OpenCV: `cv2.GaussianBlur(image, ksize=(5, 5), sigmaX=1.0)`
- **Bilateral Edge-Preserving Filter:**
  - Smooths high-frequency sensor noise while preserving sharp garment and body perimeter edges by combining spatial distance with photometric color intensity difference.
  - OpenCV: `cv2.bilateralFilter(image, d=9, sigmaColor=75, sigmaSpace=75)`

### Stage 2.3: Thresholding & Background / Skin Segmentation
- **HSV Dual Color Thresholding:**
  - Separate human subject from background:
    ```python
    lower_skin = np.array([0, 20, 70], dtype=np.uint8)
    upper_skin = np.array([25, 255, 255], dtype=np.uint8)
    skin_mask = cv2.inRange(hsv_image, lower_skin, upper_skin)
    ```
- **Otsu's Global Bimodal Thresholding (Fallback):**
  - Minimizes intra-class intensity variance:
    ```python
    _, binary_mask = cv2.threshold(gray_image, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    ```

### Stage 2.4: Mathematical Morphology
- **Structuring Elements:**
  - Elliptical or rectangular kernels: `kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))`
- **Morphological Opening ($A \circ B = (A \ominus B) \oplus B$):**
  - Erosion followed by Dilation. Eliminates small isolated noise pixels and hair artifacts without altering overall contour area.
  - OpenCV: `cv2.morphologyEx(binary_mask, cv2.MORPH_OPEN, kernel)`
- **Morphological Closing ($A \bullet B = (A \oplus B) \ominus B$):**
  - Dilation followed by Erosion. Fills small internal holes and bridges discontinuities within clothing/torso silhouettes.
  - OpenCV: `cv2.morphologyEx(binary_mask, cv2.MORPH_CLOSE, kernel_large)`

### Stage 2.5: Gradient & Contour Feature Extraction
- **Canny Multi-Stage Edge Detection:**
  1. Gaussian smoothing ($5 \times 5$).
  2. Intensity gradient magnitude via Sobel operators: $G = \sqrt{G_x^2 + G_y^2}$, $\theta = \arctan(G_y / G_x)$.
  3. Non-maximum suppression along gradient direction.
  4. Hysteresis thresholding ($T_{\text{lower}} = 50$, $T_{\text{upper}} = 150$).
  - OpenCV: `cv2.Canny(gray_image, threshold1=50, threshold2=150)`
- **Topological Contour Hierarchy Analysis:**
  - Extract external perimeter contours:
    ```python
    contours, _ = cv2.findContours(cleaned_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    dominant_contour = max(contours, key=cv2.contourArea)
    x, y, w, h = cv2.boundingRect(dominant_contour)
    ```

### Stage 2.6: Body-Region Landmark Estimation
- **Classical Geometric Heuristics:**
  - Compute contour spatial moments: Centroid $C_x = \frac{M_{10}}{M_{00}}$, $C_y = \frac{M_{01}}{M_{00}}$.
  - Horizontal scanline pixel width profile across torso slice ($y \in [0.15 \cdot h, 0.55 \cdot h]$).
  - Inflection detection identifies:
    - Left Shoulder: $P_{ls} = (X_{\text{left}}, Y_{\text{shoulder}})$
    - Right Shoulder: $P_{rs} = (X_{\text{right}}, Y_{\text{shoulder}})$
    - Neck Center: $P_n = (C_x, Y_{\text{shoulder}} - \Delta y)$
    - Torso Hemline: $P_b = (C_x, Y_{\text{shoulder}} + 1.4 \cdot \text{shoulder\_span})$

### Stage 2.7: 2D Spatial Transformations
- **3-Point 2D Affine Transformation:**
  - Affine transformation preserves collinearity, parallelism, and ratio of distances:
    $$\begin{bmatrix} x' \\ y' \end{bmatrix} = \begin{bmatrix} a_{11} & a_{12} \\ a_{21} & a_{22} \end{bmatrix} \begin{bmatrix} x \\ y \end{bmatrix} + \begin{bmatrix} t_x \\ t_y \end{bmatrix}$$
  - Compute mapping matrix $M \in \mathbb{R}^{2 \times 3}$:
    ```python
    src_tri = np.float32([garment_ls, garment_rs, garment_hem])
    dst_tri = np.float32([body_ls, body_rs, body_hem])
    M = cv2.getAffineTransform(src_tri, dst_tri)
    warped_garment = cv2.warpAffine(garment_bgr, M, (canvas_w, canvas_h), flags=cv2.INTER_LINEAR)
    warped_alpha = cv2.warpAffine(garment_alpha, M, (canvas_w, canvas_h), flags=cv2.INTER_LINEAR)
    ```

### Stage 2.8: Alpha Blending & Compositing
- **Gaussian Edge Feathering:**
  - Normalize alpha mask to $[0.0, 1.0]$.
  - Soften step-function boundary to eliminate hard pixel staircasing:
    $$\alpha_{\text{feathered}} = \text{cv2.GaussianBlur}(\alpha_{\text{norm}}, (5, 5), 1.5)$$
- **Convex Linear Color Combination:**
  - For each color channel $c \in \{B, G, R\}$:
    $$I_{\text{out}}(x, y, c) = \alpha_{\text{feathered}}(x, y) \cdot I_{\text{garment}}(x, y, c) + (1.0 - \alpha_{\text{feathered}}(x, y)) \cdot I_{\text{subject}}(x, y, c)$$
- **Illumination Matching:**
  - Measure median Value channel in subject neck/torso region $V_{\text{target}}$ vs. garment $V_{\text{garment}}$.
  - Scale garment RGB by $\kappa = \text{clip}(V_{\text{target}} / V_{\text{garment}}, 0.85, 1.15)$ before blending.
