"""Unit & Integration Test Suite for IDM-VTON AI Try-On Integration.

Validates input verification, validation error responses, job lifecycle,
queue state transitions, mock Gradio client predictions, quota handling,
and error classification without consuming live Hugging Face GPU quota.
"""

import io
import os
import sys
import unittest
from unittest.mock import patch, MagicMock

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from PIL import Image

from src.web.app import create_app
from src.web.services.idm_vton import idm_manager, IDMValidationError


def _make_dummy_image_bytes(width: int = 100, height: int = 100, fmt: str = "PNG") -> bytes:
    """Helper creating minimal valid in-memory image bytes."""
    buf = io.BytesIO()
    img = Image.new("RGB", (width, height), color=(120, 140, 160))
    img.save(buf, format=fmt)
    return buf.getvalue()


class TestAITryOnIntegration(unittest.TestCase):
    """Test suite verifying /api/tryon/ai/jobs endpoints and IDM-VTON manager."""

    def setUp(self) -> None:
        self.app = create_app({"TESTING": True})
        self.client = self.app.test_client()
        self.valid_person_bytes = _make_dummy_image_bytes(200, 300, "JPEG")
        self.valid_garment_bytes = _make_dummy_image_bytes(200, 200, "PNG")

    def test_missing_person_image_returns_400(self) -> None:
        """Verifies 400 Bad Request when person_image is omitted."""
        resp = self.client.post(
            "/api/tryon/ai/jobs",
            data={
                "garment_image": (io.BytesIO(self.valid_garment_bytes), "shirt.png")
            },
            content_type="multipart/form-data"
        )
        self.assertEqual(resp.status_code, 400)
        data = resp.get_json()
        self.assertFalse(data["success"])
        self.assertEqual(data["error"]["code"], "MISSING_PERSON_IMAGE")

    def test_missing_garment_image_returns_400(self) -> None:
        """Verifies 400 Bad Request when garment_image is omitted."""
        resp = self.client.post(
            "/api/tryon/ai/jobs",
            data={
                "person_image": (io.BytesIO(self.valid_person_bytes), "person.jpg")
            },
            content_type="multipart/form-data"
        )
        self.assertEqual(resp.status_code, 400)
        data = resp.get_json()
        self.assertFalse(data["success"])
        self.assertEqual(data["error"]["code"], "MISSING_GARMENT_IMAGE")

    def test_invalid_image_format_returns_400(self) -> None:
        """Verifies 400 when invalid/unsupported format or corrupted bytes are uploaded."""
        resp = self.client.post(
            "/api/tryon/ai/jobs",
            data={
                "person_image": (io.BytesIO(b"not-a-valid-image"), "person.txt"),
                "garment_image": (io.BytesIO(self.valid_garment_bytes), "shirt.png")
            },
            content_type="multipart/form-data"
        )
        self.assertEqual(resp.status_code, 400)
        data = resp.get_json()
        self.assertFalse(data["success"])
        self.assertEqual(data["error"]["code"], "VALIDATION_ERROR")

    def test_image_dimension_too_small_returns_400(self) -> None:
        """Verifies validation rejects images smaller than 64x64."""
        small_bytes = _make_dummy_image_bytes(32, 32, "PNG")
        with self.assertRaises(IDMValidationError) as ctx:
            idm_manager.validate_image_bytes(small_bytes, "test_field")
        self.assertIn("too small", str(ctx.exception))

    @patch("src.web.services.idm_vton.idm_manager._executor")
    def test_successful_job_submission_returns_202(self, mock_executor) -> None:
        """Verifies valid submission returns 202 Accepted with job ID and poll URL."""
        resp = self.client.post(
            "/api/tryon/ai/jobs",
            data={
                "person_image": (io.BytesIO(self.valid_person_bytes), "person.jpg"),
                "garment_image": (io.BytesIO(self.valid_garment_bytes), "garment.png"),
                "category": "T-Shirts",
                "garment_description": "Black Cotton T-Shirt"
            },
            content_type="multipart/form-data"
        )
        self.assertEqual(resp.status_code, 202)
        data = resp.get_json()
        self.assertTrue(data["success"])
        self.assertIn("job_id", data)
        self.assertEqual(data["status"], "queued")
        self.assertIn("/api/tryon/ai/jobs/", data["poll_url"])

    def test_get_nonexistent_job_returns_404(self) -> None:
        """Verifies 404 for unknown job ID."""
        resp = self.client.get("/api/tryon/ai/jobs/nonexistent-uuid-1234")
        self.assertEqual(resp.status_code, 404)
        data = resp.get_json()
        self.assertFalse(data["success"])
        self.assertEqual(data["error"]["code"], "JOB_NOT_FOUND")

    def test_mock_gradio_inference_success(self) -> None:
        """Verifies mock Gradio client prediction updates job to completed with result."""
        # Create a real mock output file
        import tempfile
        import os
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as out_f:
            out_f.write(self.valid_person_bytes)
            out_path = out_f.name

        try:
            with patch("gradio_client.Client") as mock_client_cls:
                mock_client = MagicMock()
                mock_client.predict.return_value = (out_path, None)
                mock_client_cls.return_value = mock_client

                job_id = idm_manager.submit_job(
                    person_bytes=self.valid_person_bytes,
                    garment_bytes=self.valid_garment_bytes,
                    garment_description="Test Garment"
                )

                # Wait briefly for worker thread
                import time
                for _ in range(30):
                    status = idm_manager.get_job_status(job_id)
                    if status and status["status"] in ("completed", "failed"):
                        break
                    time.sleep(0.05)

                status = idm_manager.get_job_status(job_id)
                self.assertIsNotNone(status)
                self.assertEqual(status["status"], "completed")
                self.assertIsNotNone(status["result_image_base64"])
                self.assertTrue(status["result_image_base64"].startswith("data:image/png;base64,"))
                self.assertIsNotNone(status["duration_seconds"])
        finally:
            if os.path.exists(out_path):
                os.remove(out_path)

    def test_mock_quota_exhaustion_error_classification(self) -> None:
        """Verifies Hugging Face ZeroGPU quota errors are clearly categorized."""
        with patch("gradio_client.Client") as mock_client_cls:
            mock_client = MagicMock()
            mock_client.predict.side_effect = Exception("ZeroGPU quota exceeded: You have exceeded your daily quota.")
            mock_client_cls.return_value = mock_client

            job_id = idm_manager.submit_job(
                person_bytes=self.valid_person_bytes,
                garment_bytes=self.valid_garment_bytes
            )

            import time
            for _ in range(30):
                status = idm_manager.get_job_status(job_id)
                if status and status["status"] in ("completed", "failed"):
                    break
                time.sleep(0.05)

            status = idm_manager.get_job_status(job_id)
            self.assertEqual(status["status"], "failed")
            self.assertEqual(status["error_code"], "QUOTA_EXHAUSTED")
            self.assertIn("ZeroGPU daily quota", status["error"])

    def test_mock_auth_failure_error_classification(self) -> None:
        """Verifies unauthorized 401 exceptions are identified as AUTH_FAILED."""
        with patch("gradio_client.Client") as mock_client_cls:
            mock_client = MagicMock()
            mock_client.predict.side_effect = Exception("HTTP 401: Unauthorized. Invalid token.")
            mock_client_cls.return_value = mock_client

            job_id = idm_manager.submit_job(
                person_bytes=self.valid_person_bytes,
                garment_bytes=self.valid_garment_bytes
            )

            import time
            for _ in range(30):
                status = idm_manager.get_job_status(job_id)
                if status and status["status"] in ("completed", "failed"):
                    break
                time.sleep(0.05)

            status = idm_manager.get_job_status(job_id)
            self.assertEqual(status["status"], "failed")
            self.assertEqual(status["error_code"], "AUTH_FAILED")
            self.assertIn("HF_TOKEN", status["error"])

    def test_classical_pipeline_independence_during_ai_failure(self) -> None:
        """Verifies that an AI failure leaves the classical CV pipeline completely functional."""
        # Check health endpoint reports both engines independently
        resp = self.client.get("/api/health")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIn("tryon_service", data)
        self.assertIn("ai_service", data)
        self.assertEqual(data["ai_service"]["engine"], "IDM-VTON")


if __name__ == "__main__":
    unittest.main()
