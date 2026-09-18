---
name: flask-api-patterns
description: >-
  Standard engineering patterns for building the Stylinger Flask REST API.
  Covers the Application Factory pattern, multipart file upload decoding,
  ephemeral UUID session directories, structured error contracts, and zero-database architecture.
---

# Flask API Engineering & Session Lifecycle Patterns

This skill defines the technical standards for the Flask web tier in the Stylinger project (`src/web/`).

## 1. Architectural Principles
- **No Database:** Stylinger operates without SQLite, PostgreSQL, or ORMs. All data resides in memory or ephemeral session folders.
- **Application Factory Pattern:** Always instantiate Flask via `create_app()` to enable modular testing and clean configuration isolation.
- **Decoupled Processing:** Flask routes must **never** contain raw computer vision math. Routes import and execute pure functions from `src/processing/` and serialize the results.
- **No PyQt5 Imports:** Never import `PyQt5` or GUI modules in `src/web/`.

---

## 2. Application Factory & Route Registration

```python
# src/web/app.py
from flask import Flask
import os

def create_app(test_config=None) -> Flask:
    """Application factory for Stylinger Web Studio."""
    app = Flask(
        __name__,
        template_folder="templates",
        static_folder="static"
    )
    app.config.from_mapping(
        SECRET_KEY=os.urandom(24),
        MAX_CONTENT_LENGTH=10 * 1024 * 1024, # 10 MB limit
        SESSION_DIR=os.path.abspath("temp/sessions")
    )
    if test_config:
        app.config.update(test_config)

    # Register blueprint routes
    from src.web.routes import api_bp, main_bp
    app.register_blueprint(main_bp)
    app.register_blueprint(api_bp, url_prefix="/api")

    return app
```

---

## 3. Secure Multipart File Upload Handling

### 3.1 Filename Sanitation & Decoding
Always sanitize the filename using `werkzeug.utils.secure_filename` and decode image bytes into OpenCV BGR matrices in memory before touching disk:

```python
import cv2
import numpy as np
import uuid
from werkzeug.utils import secure_filename
from flask import request, jsonify

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

def allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def handle_upload():
    if 'image' not in request.files:
        return error_response("NO_IMAGE_PROVIDED", "No image file part in request.", 400)

    file = request.files['image']
    if file.filename == '':
        return error_response("EMPTY_FILENAME", "No selected file.", 400)

    if not allowed_file(file.filename):
        return error_response("UNSUPPORTED_FORMAT", "Only PNG, JPG, JPEG, and WEBP are supported.", 415)

    # Read binary stream directly into memory
    file_bytes = np.frombuffer(file.read(), np.uint8)
    image_bgr = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

    if image_bgr is None or image_bgr.size == 0:
        return error_response("CORRUPTED_IMAGE", "File bytes could not be decoded as an image matrix.", 422)

    h, w = image_bgr.shape[:2]
    if h < 300 or w < 300:
        return error_response("IMAGE_TOO_SMALL", "Image resolution must be at least 300x300 pixels.", 400)

    # Initialize isolated UUID4 session
    session_id = str(uuid.uuid4())
    session_path = os.path.join(current_app.config['SESSION_DIR'], session_id)
    os.makedirs(session_path, exist_ok=True)

    # Cache raw image matrix
    cv2.imwrite(os.path.join(session_path, "original.png"), image_bgr)

    return jsonify({
        "success": True,
        "session_id": session_id,
        "filename": secure_filename(file.filename),
        "dimensions": {"width": w, "height": h, "channels": 3},
        "preview_url": f"/api/artifacts/{session_id}/original"
    }), 201
```

---

## 4. Ephemeral Session Lifecycle & Automated Cleanup
- Sessions are stored at `temp/sessions/<session_id>/`.
- Artifacts produced: `original.png`, `grayscale.png`, `hsv_mask.png`, `morph_mask.png`, `canny_edges.png`, `contours_anchors.png`, `warped_garment.png`, `composite.png`.
- A background or pre-request cleanup routine checks file modification times:
  ```python
  import time
  def prune_expired_sessions(session_root: str, max_age_seconds: int = 3600):
      now = time.time()
      if not os.path.exists(session_root):
          return
      for entry in os.scandir(session_root):
          if entry.is_dir():
              if now - entry.stat().st_mtime > max_age_seconds:
                  shutil.rmtree(entry.path, ignore_errors=True)
  ```

---

## 5. Standardized Error Response Contract

All error endpoints must return uniform JSON payloads:

```python
def error_response(code: str, message: str, status_code: int = 400, details: dict = None):
    payload = {
        "success": False,
        "error": {
            "code": code,
            "message": message,
            "status_code": status_code
        }
    }
    if details:
        payload["error"]["details"] = details
    return jsonify(payload), status_code
```
