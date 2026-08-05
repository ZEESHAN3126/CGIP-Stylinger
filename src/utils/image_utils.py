"""Image Utilities Module for Stylinger.

This module provides helper utilities for generating synthetic image matrices,
rendering overlay text, and converting OpenCV NumPy arrays to PyQt5 QPixmap formats.
"""

from typing import Tuple
import cv2
import numpy as np
from PyQt5.QtGui import QImage, QPixmap


def create_synthetic_image(
    height: int = 500,
    width: int = 500,
    color: Tuple[int, int, int] = (240, 240, 245)
) -> np.ndarray:
    """Generates a synthetic RGB image matrix with a subtle gradient pattern.

    Args:
        height (int): Height of the output image in pixels. Defaults to 500.
        width (int): Width of the output image in pixels. Defaults to 500.
        color (Tuple[int, int, int]): Base BGR color tuple. Defaults to light gray/blue.

    Returns:
        np.ndarray: A 3-channel BGR image array of shape (height, width, 3).
    """
    # Create base background matrix
    image = np.full((height, width, 3), color, dtype=np.uint8)

    # Draw vertical and horizontal grid lines to simulate fabric texture
    grid_spacing = 50
    grid_color = (210, 210, 220)
    for x in range(0, width, grid_spacing):
        cv2.line(image, (x, 0), (x, height), grid_color, 1)
    for y in range(0, height, grid_spacing):
        cv2.line(image, (0, y), (width, y), grid_color, 1)

    # Draw decorative fashion design elements (geometric shapes)
    cv2.circle(image, (width // 2, height // 2), 120, (180, 140, 255), 3)
    cv2.rectangle(image, (100, 100), (width - 100, height - 100), (255, 180, 140), 2)

    return image


def draw_text_overlay(
    image: np.ndarray,
    text: str = "Stylinger Pipeline OK",
    position: Tuple[int, int] = (30, 260),
    font_scale: float = 0.9,
    color: Tuple[int, int, int] = (40, 40, 200),
    thickness: int = 2
) -> np.ndarray:
    """Draws a text string overlay onto an OpenCV image array.

    Args:
        image (np.ndarray): Source BGR image array.
        text (str): String message to overlay. Defaults to "Stylinger Pipeline OK".
        position (Tuple[int, int]): (x, y) coordinates for text origin.
        font_scale (float): Scale factor for font size.
        color (Tuple[int, int, int]): BGR color tuple for the text.
        thickness (int): Line thickness for text drawing.

    Returns:
        np.ndarray: Image array with text drawn upon it.
    """
    output_image = image.copy()
    font = cv2.FONT_HERSHEY_SIMPLEX

    # Add shadow effect for enhanced legibility
    shadow_color = (255, 255, 255)
    cv2.putText(
        output_image,
        text,
        (position[0] + 1, position[1] + 1),
        font,
        font_scale,
        shadow_color,
        thickness + 2,
        cv2.LINE_AA
    )

    # Main text overlay
    cv2.putText(
        output_image,
        text,
        position,
        font,
        font_scale,
        color,
        thickness,
        cv2.LINE_AA
    )

    return output_image


def cv2_to_qpixmap(cv_img: np.ndarray) -> QPixmap:
    """Converts an OpenCV image array (BGR or Grayscale) to a PyQt5 QPixmap.

    Args:
        cv_img (np.ndarray): Input image NumPy matrix. Can be 2D (Grayscale)
            or 3D (BGR/RGB).

    Returns:
        QPixmap: PyQt5 compatible image pixmap for UI display.

    Raises:
        ValueError: If image dimensions or channels are unsupported.
    """
    if cv_img is None or cv_img.size == 0:
        raise ValueError("Input OpenCV image array is empty or None.")

    # Grayscale image (2D matrix)
    if len(cv_img.shape) == 2:
        height, width = cv_img.shape
        bytes_per_line = width
        q_img = QImage(
            cv_img.data,
            width,
            height,
            bytes_per_line,
            QImage.Format_Grayscale8
        )
    # Color image (3D matrix)
    elif len(cv_img.shape) == 3:
        height, width, channels = cv_img.shape
        if channels == 3:
            # Convert BGR (OpenCV default) to RGB (Qt expectation)
            rgb_image = cv2.cvtColor(cv_img, cv2.COLOR_BGR2RGB)
            bytes_per_line = channels * width
            q_img = QImage(
                rgb_image.data,
                width,
                height,
                bytes_per_line,
                QImage.Format_RGB888
            )
        elif channels == 4:
            rgb_image = cv2.cvtColor(cv_img, cv2.COLOR_BGRA2RGBA)
            bytes_per_line = channels * width
            q_img = QImage(
                rgb_image.data,
                width,
                height,
                bytes_per_line,
                QImage.Format_RGBA8888
            )
        else:
            raise ValueError(f"Unsupported number of channels: {channels}")
    else:
        raise ValueError(f"Invalid image array shape: {cv_img.shape}")

    return QPixmap.fromImage(q_img)
