"""Unit tests for Stylinger Phase 1 Web Studio.

Validates Flask application factory instantiation, route responses,
static asset serving, health telemetry, and 404 error handling.
"""

import sys
import os
import unittest

# Ensure src is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.web.app import create_app


class TestStylingerWebStudio(unittest.TestCase):
    """Test suite verifying Flask web application routes and factory configuration."""

    def setUp(self) -> None:
        """Sets up test client before executing each test method."""
        self.app = create_app({"TESTING": True})
        self.client = self.app.test_client()

    def test_factory_creation(self) -> None:
        """Verifies Flask factory returns valid app instance with testing enabled."""
        self.assertIsNotNone(self.app)
        self.assertTrue(self.app.config["TESTING"])

    def test_homepage_route(self) -> None:
        """Verifies GET / returns 200 OK with expected studio branding."""
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        content = response.get_data(as_text=True)
        self.assertIn("Stylinger", content)
        self.assertIn("Classical CG/IP", content)
        self.assertIn("Processing Pipeline", content)
        self.assertIn("Garment Catalog", content)

    def test_health_telemetry_endpoint(self) -> None:
        """Verifies GET /api/health returns 200 OK with status and academic scope."""
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("Phase", data["phase"])  # Phase 2+ integration
        self.assertIn("Classical CG/IP", data["academic_scope"])

    def test_static_css_assets_served(self) -> None:
        """Verifies design tokens and main stylesheet are accessible without 404."""
        res_vars = self.client.get("/static/css/variables.css")
        self.assertEqual(res_vars.status_code, 200)
        self.assertIn("--bg-primary", res_vars.get_data(as_text=True))
        res_vars.close()

        res_main = self.client.get("/static/css/main.css")
        self.assertEqual(res_main.status_code, 200)
        self.assertIn(".studio-header", res_main.get_data(as_text=True))
        res_main.close()

    def test_static_js_asset_served(self) -> None:
        """Verifies client orchestration script is accessible without 404."""
        res_js = self.client.get("/static/js/app.js")
        self.assertEqual(res_js.status_code, 200)
        js_text = res_js.get_data(as_text=True)
        # Phase 2 integration renamed telemetry init to initStatusBar
        self.assertTrue(
            "initStatusBar" in js_text or "initStudioTelemetry" in js_text,
            "Expected telemetry init function in app.js"
        )
        res_js.close()

    def test_api_not_found_returns_json(self) -> None:
        """Verifies nonexistent API routes return structured JSON 404."""
        response = self.client.get("/api/nonexistent")
        self.assertEqual(response.status_code, 404)
        data = response.get_json()
        self.assertFalse(data["success"])
        self.assertEqual(data["error"]["code"], "RESOURCE_NOT_FOUND")


if __name__ == "__main__":
    unittest.main()
