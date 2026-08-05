"""Smoke Test Suite for Stylinger Hello World Pipeline.

Automated non-GUI tests validating synthetic image generation, text overlay,
grayscale conversion, Canny edge detection, and matrix transformations.
"""

import sys
import os
import unittest
import numpy as np

# Ensure src directory is in sys.path for module resolution
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src")))

from utils.image_utils import create_synthetic_image, draw_text_overlay
from processing.filters import (
    rgb_to_grayscale,
    apply_gaussian_blur,
    canny_edge_detection,
    run_hello_world_pipeline
)


class TestStylingerPipeline(unittest.TestCase):
    """Unit test cases for validating Stylinger CG/IP processing operations."""

    def setUp(self) -> None:
        """Sets up test fixtures before executing each test method."""
        self.height = 300
        self.width = 300
        self.synthetic_img = create_synthetic_image(height=self.height, width=self.width)

    def test_synthetic_image_generation(self) -> None:
        """Verifies synthetic image matrix dimensions, dtype, and color channels."""
        self.assertIsNotNone(self.synthetic_img)
        self.assertIsInstance(self.synthetic_img, np.ndarray)
        self.assertEqual(self.synthetic_img.shape, (self.height, self.width, 3))
        self.assertEqual(self.synthetic_img.dtype, np.uint8)

    def test_text_overlay_rendering(self) -> None:
        """Verifies text overlay returns identical dimensions with modified pixels."""
        text = "CG & IP Pipeline OK"
        image_with_text = draw_text_overlay(self.synthetic_img, text=text)

        self.assertEqual(image_with_text.shape, self.synthetic_img.shape)
        self.assertEqual(image_with_text.dtype, np.uint8)
        # Ensure pixels were modified by text overlay operation
        self.assertFalse(np.array_equal(self.synthetic_img, image_with_text))

    def test_rgb_to_grayscale_conversion(self) -> None:
        """Verifies color image converts to single-channel Grayscale 2D matrix."""
        gray = rgb_to_grayscale(self.synthetic_img)

        self.assertEqual(len(gray.shape), 2)
        self.assertEqual(gray.shape, (self.height, self.width))
        self.assertEqual(gray.dtype, np.uint8)

    def test_gaussian_blur(self) -> None:
        """Verifies Gaussian blur filter returns smoothed image array."""
        gray = rgb_to_grayscale(self.synthetic_img)
        blurred = apply_gaussian_blur(gray, kernel_size=(5, 5), sigma_x=1.0)

        self.assertEqual(blurred.shape, gray.shape)
        self.assertEqual(blurred.dtype, np.uint8)

    def test_canny_edge_detection(self) -> None:
        """Verifies Canny Edge Detection generates binary 2D edge matrix."""
        gray = rgb_to_grayscale(self.synthetic_img)
        edges = canny_edge_detection(gray, threshold1=50, threshold2=150)

        self.assertEqual(len(edges.shape), 2)
        self.assertEqual(edges.shape, (self.height, self.width))
        self.assertEqual(edges.dtype, np.uint8)

        # Unique values in binary edge image should only contain 0 (background) and 255 (edges)
        unique_vals = np.unique(edges)
        for val in unique_vals:
            self.assertIn(val, [0, 255])

    def test_hello_world_pipeline_execution(self) -> None:
        """Verifies full Hello World processing pipeline returns all required outputs."""
        image_with_text = draw_text_overlay(self.synthetic_img, text="Stylinger Pipeline OK")
        results = run_hello_world_pipeline(image_with_text)

        self.assertIn("grayscale", results)
        self.assertIn("blurred", results)
        self.assertIn("edges", results)

        self.assertEqual(results["grayscale"].shape, (self.height, self.width))
        self.assertEqual(results["edges"].shape, (self.height, self.width))


if __name__ == "__main__":
    unittest.main()
