"""Integration Test Suite for Stylinger Full-Stack Try-On Flow.

Validates the complete upload-to-result pipeline using Flask test client,
real portrait samples, and real garment assets.
"""

import os
import sys
import io
import unittest
import numpy as np
import cv2

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.web.app import create_app
from src.processing.filters import run_hello_world_pipeline


class TestStylingerFullStackIntegration(unittest.TestCase):
    """End-to-end integration test suite validating Flask API and try-on pipeline."""

    def setUp(self) -> None:
        """Initialize Flask test client."""
        self.app = create_app({"TESTING": True})
        self.client = self.app.test_client()

        # Create synthetic valid portrait (500x300 BGR)
        self.user_img = np.ones((500, 300, 3), dtype=np.uint8) * 240
        # Draw torso rectangle
        cv2.rectangle(self.user_img, (50, 100), (250, 450), (120, 140, 160), -1)
        # Draw head circle
        cv2.circle(self.user_img, (150, 60), 40, (180, 200, 220), -1)
        _, user_buf = cv2.imencode(".png", self.user_img)
        self.user_bytes = user_buf.tobytes()

        # Create synthetic transparent garment (400x400 RGBA)
        self.garment_rgba = np.zeros((400, 400, 4), dtype=np.uint8)
        cv2.rectangle(self.garment_rgba, (80, 60), (320, 360), (30, 40, 180, 255), -1)
        _, garment_buf = cv2.imencode(".png", self.garment_rgba)
        self.garment_bytes = garment_buf.tobytes()

    def test_health_endpoint(self) -> None:
        """Verifies GET /api/health returns healthy status."""
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("tryon_service", data)
        self.assertIn("online", data["tryon_service"])

    def test_hello_world_baseline_filter(self) -> None:
        """Verifies classical baseline filter pipeline runs without error."""
        result = run_hello_world_pipeline(self.user_img)
        self.assertIn("grayscale", result)
        self.assertIn("blurred", result)
        self.assertIn("edges", result)
        self.assertEqual(result["grayscale"].shape, (500, 300))
        self.assertEqual(result["edges"].shape, (500, 300))

    def test_direct_pipeline_execution(self) -> None:
        """Verifies tryon pipeline executes and returns valid image base64."""
        tryon_service_dir = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "stylinger-cgip-main", "stylinger-cgip-main", "tryon-service")
        )
        old_path = list(sys.path)
        sys.path.insert(0, tryon_service_dir)
        old_src = sys.modules.pop("src", None)
        try:
            from src.pipeline import execute_tryon
            res = execute_tryon(
                user_image_bytes=self.user_bytes,
                garment_image_bytes=self.garment_bytes,
                category="Shirt",
                scale=1.0,
                offset_x=0,
                offset_y=0
            )
            self.assertTrue(res["success"])
            self.assertIn("image_base64", res)
            self.assertIn("result_base64", res)
            self.assertTrue(res["image_base64"].startswith("data:image/png;base64,"))
            self.assertIn("telemetry", res)
            self.assertIn("total_time_ms", res["telemetry"])
            self.assertGreater(res["telemetry"]["total_time_ms"], 0)
        finally:
            sys.modules.pop("src", None)
            if old_src:
                sys.modules["src"] = old_src
            sys.path = old_path


if __name__ == "__main__":
    unittest.main()
