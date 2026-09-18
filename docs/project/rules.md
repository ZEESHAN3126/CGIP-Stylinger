# Stylinger — Project Rules & Engineering Guidelines (rules.md)

**Document Status:** Enforced Engineering Guidelines  
**Project:** Stylinger — Virtual Fashion Styling using Computer Graphics and Image Processing  
**Applicability:** All Future Phases, Features, Pull Requests & Architecture Decisions  

---

## 1. Academic Scope & Algorithmic Integrity Rules

### Rule 1.1: The Project Proposal is the Inviolable Source of Truth
Every feature, pipeline stage, and workflow must directly map to the approved academic project proposal:
- User $\to$ Upload Image $\to$ Image Preprocessing $\to$ Background Segmentation $\to$ Feature & Contour Extraction $\to$ Clothing Selection $\to$ Garment Alignment & Transformation $\to$ Image Compositing / Alpha Blending $\to$ Outfit Visualization $\to$ Save / Download.
- Any feature outside this chain requires formal academic re-scoping.

### Rule 1.2: Classical Computer Vision & Image Processing Only
- All image transformations, segmentation routines, and feature detectors must be implemented using **deterministic, classical digital image processing algorithms** (OpenCV, NumPy, Pillow).
- Mathematical transparency is paramount: calculations must rely on matrix operations, convolution kernels, color space mathematics, morphology, and affine mapping.

### Rule 1.3: Absolute Ban on Deep Learning & External Black-Box AI
Under no circumstances may the following be introduced into the repository:
- **NO YOLO** or neural object detection frameworks.
- **NO MediaPipe** or deep pose/landmark networks.
- **NO PyTorch, TensorFlow, Keras, ONNX**, or neural inference runtimes.
- **NO Generative AI, GANs, or Diffusion Models**.
- **NO External Paid APIs** or cloud-hosted AI try-on services.
- **NO 3D Graphics Engines, 3D Meshes, or Rigging Simulations**.

---

## 2. Architectural Preservation & Dual-Interface Rules

### Rule 2.1: Preserve Baseline PyQt5 Application Unbroken
- The baseline PyQt5 desktop GUI (`src/gui/main_window.py` and `src/main.py`) serves as the foundational milestone verification suite.
- It must **never be deleted, disabled, or broken**.
- Future commits must continue to pass automated smoke tests in `tests/test_pipeline.py`.

### Rule 2.2: Flask is the Primary Web Presentation Layer
- All new user-facing functionality, virtual styling interactions, and catalog workflows belong to the Flask web studio (`src/web/`).
- The web app and desktop GUI share the underlying processing algorithms located in `src/processing/`.

### Rule 2.3: Decoupled Module Architecture
- Algorithms in `src/processing/` must remain pure Python/OpenCV functions with **zero GUI or Web framework dependencies**.
- No `import PyQt5` inside `src/processing/` or `src/web/`.
- No `import flask` inside `src/processing/` or `src/gui/`.

---

## 3. Technology Stack & Dependency Constraints

### Rule 3.1: Zero Unnecessary Dependencies
- Permitted dependencies: `python`, `opencv-python`, `numpy`, `pillow`, `matplotlib` (debug), `PyQt5` (baseline), `flask`, `werkzeug`.
- Do not introduce frontend JavaScript frameworks (React, Vue, Angular), CSS utility frameworks (Tailwind, Bootstrap), or server databases (SQLite, PostgreSQL).
- Keep frontend vanilla: Semantic HTML5, Vanilla CSS3 tokens, and ES6+ JavaScript.

### Rule 3.2: No Hardcoded Secrets or Credentials
- Stylinger operates locally without API keys. No private keys, sensitive URLs, or credentials may be stored or committed.

---

## 4. Ingestion, Security & File Management Rules

### Rule 4.1: Strict Upload Validation
- Always sanitize filenames using `werkzeug.utils.secure_filename()`.
- Validate file extensions (`.png`, `.jpg`, `.jpeg`, `.webp`).
- Validate MIME types and verify byte decoding using `cv2.imdecode`.
- Reject empty, oversized ($> 10$ MB), or undersized ($< 300 \times 300$ px) images before running pipeline operations.

### Rule 4.2: Ephemeral Temporary File Lifecycle
- Uploads and intermediate matrices reside exclusively in isolated session directories (`temp/sessions/<session_id>/`).
- Implement defensive disk quotas: automatically prune temporary session directories older than 60 minutes.
- Prevent path traversal vulnerabilities by enforcing strict UUID session IDs.

---

## 5. UI/UX, Design & Accessibility Standards

### Rule 5.1: High-Aesthetic Atelier Theme (Anti-Generic Design)
- The user interface must maintain an editorial, luxury fashion-tech aesthetic (*Haute Numérique*).
- Never use default Bootstrap or Tailwind styling cards.
- Restrained color palette: Deep Obsidian (`#0A0C0F`), Atelier Slate (`#12151B`), Liquid Gold (`#D4AF37`), Warm Alabaster (`#F7F6F3`).
- Editorial typography: Playfair Display serif paired with Inter and JetBrains Mono.

### Rule 5.2: Spatial Continuity in Interaction
- User interactions (garment fitting, before/after comparison) must feel physically connected to the image.
- Use the tactile curtain slider for before/after comparison.
- Provide real-time processing feedback via step-by-step progress indicators.

### Rule 5.3: Accessibility (WCAG AA Compliance)
- Maintain minimum $4.5:1$ text contrast for all body copy and $3:1$ for large headings.
- Ensure all interactive elements (sliders, buttons, cards) are keyboard navigable via `Tab` and `Enter/Space`.
- Respect user motion preferences by disabling transitions under `prefers-reduced-motion`.

---

## 6. Performance, Error Handling & Code Quality

### Rule 6.1: Real-Time Performance Target
- The end-to-end processing pipeline must execute in $< 1.5$ seconds on consumer hardware.
- Normalize large images to a working resolution (e.g., height 1200px) during interactive styling, retaining source coordinates for full-resolution export.

### Rule 6.2: Explicit, Actionable Error Messaging
- Never show raw stack traces or cryptic Python exceptions in the UI.
- All backend errors must return structured JSON:
  ```json
  { "success": false, "error": { "code": "...", "message": "...", "status_code": 400 } }
  ```
- Client-side error toasts must instruct the user how to fix the issue (e.g., "Image contrast too low. Try a photo with a contrasting background.").

### Rule 6.3: Code Quality Standards
- Strict PEP 8 compliance.
- Complete Python type annotations (`Tuple`, `Dict`, `Optional`, `np.ndarray`).
- Comprehensive Google-style docstrings on all public functions and classes.
- Unit test coverage for all new algorithms added to `src/processing/`.
