---
name: cgip-testing-verification
description: >-
  Standard test harness, regression testing, and verification procedures for Stylinger.
  Covers non-GUI Python unittest suites, OpenCV matrix shape/dtype assertions,
  Flask test client API verification, and PyQt5 baseline preservation.
---

# CG/IP Testing & Regression Verification Runbook

This skill defines the testing protocols required for every feature, algorithmic modification, and API change in Stylinger.

## 1. Testing Philosophy & Non-Negotiables
- **Headless Execution:** Unit tests must be 100% headless and executable without a display server or window manager (`python -m unittest discover tests`).
- **PyQt5 Baseline Preservation:** The baseline test suite (`tests/test_pipeline.py`) must pass with zero failures at all times.
- **Defensive Matrix Assertions:** Every image processing test must validate three properties:
  1. **Shape:** Output dimensions match expected tuple $(H, W)$ or $(H, W, C)$.
  2. **Data Type:** Output array is strictly `dtype=np.uint8` (or `np.float32` for specific intermediate weights).
  3. **Value Range:** Intensity bounds must satisfy $0 \le I(x, y) \le 255$.

---

## 2. Image Processing Matrix Verification Pattern

```python
import unittest
import numpy as np
import cv2

class TestProcessingMatrix(unittest.TestCase):
    def setUp(self):
        self.height, self.width = 300, 300
        self.test_bgr = np.full((self.height, self.width, 3), 128, dtype=np.uint8)

    def assert_valid_image(self, matrix: np.ndarray, expected_shape: tuple, expected_channels: int = 1):
        """Helper to assert matrix shape, dtype, and valid range."""
        self.assertIsNotNone(matrix)
        self.assertIsInstance(matrix, np.ndarray)
        self.assertEqual(matrix.shape, expected_shape)
        self.assertEqual(matrix.dtype, np.uint8)
        self.assertTrue(np.all(matrix >= 0) and np.all(matrix <= 255))

    def test_grayscale_conversion(self):
        from src.processing.filters import rgb_to_grayscale
        gray = rgb_to_grayscale(self.test_bgr)
        self.assert_valid_image(gray, (self.height, self.width), expected_channels=1)

    def test_alpha_compositing_bounds(self):
        from src.processing.compositing import blend_garment_alpha
        # Test extreme cases: alpha = 0 (pure background), alpha = 1 (pure garment)
        garment = np.full((self.height, self.width, 3), 255, dtype=np.uint8)
        alpha = np.zeros((self.height, self.width), dtype=np.float32)
        composite = blend_garment_alpha(self.test_bgr, garment, alpha)
        np.testing.assert_array_equal(composite, self.test_bgr)
```

---

## 3. Flask Test Client Integration Pattern

```python
import io
import unittest
from src.web.app import create_app

class TestFlaskEndpoints(unittest.TestCase):
    def setUp(self):
        self.app = create_app({"TESTING": True, "SESSION_DIR": "temp/test_sessions"})
        self.client = self.app.test_client()

    def test_upload_success(self):
        # Build synthetic JPEG image in memory
        img = np.zeros((400, 400, 3), dtype=np.uint8)
        _, buffer = cv2.imencode(".jpg", img)
        data = {"image": (io.BytesIO(buffer.tobytes()), "test_portrait.jpg")}

        response = self.client.post("/api/upload", data=data, content_type="multipart/form-data")
        self.assertEqual(response.status_code, 201)
        json_data = response.get_json()
        self.assertTrue(json_data["success"])
        self.assertIn("session_id", json_data)

    def test_upload_invalid_extension_rejected(self):
        data = {"image": (io.BytesIO(b"fake data"), "document.pdf")}
        response = self.client.post("/api/upload", data=data, content_type="multipart/form-data")
        self.assertEqual(response.status_code, 415)
```

---

## 4. Execution Commands & Verification Checklist

1. **Run Full Automated Test Suite:**
   ```bash
   .\venv\Scripts\python.exe -m unittest discover tests
   ```
2. **Verify Desktop Smoke Test Baseline:**
   ```bash
   .\venv\Scripts\python.exe src/main.py
   ```
3. **Verify Zero Regressions on Git Tree:**
   ```bash
   git status
   ```
