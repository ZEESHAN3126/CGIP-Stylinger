"""Image Processing Filters Module for Stylinger.

Implements core Digital Image Processing operations:
- RGB to Grayscale color transformation
- Gaussian spatial noise filtering
- Canny Edge Detection algorithm
- Complete baseline Hello World pipeline execution
"""

from typing import Tuple, Dict, Any
import cv2
import numpy as np


def rgb_to_grayscale(image: np.ndarray) -> np.ndarray:
    """Converts a 3-channel color image (BGR/RGB) matrix to single-channel Grayscale.

    Uses standard luminance weighting formula: Y = 0.299*R + 0.587*G + 0.114*B

    Args:
        image (np.ndarray): Input 3-channel BGR image array.

    Returns:
        np.ndarray: Single-channel Grayscale uint8 array of shape (H, W).

    Raises:
        ValueError: If input image is None or not a 3-channel matrix.
    """
    if image is None or image.size == 0:
        raise ValueError("Cannot convert empty or None image array.")

    if len(image.shape) == 2:
        # Already single channel grayscale
        return image.copy()

    if len(image.shape) == 3 and image.shape[2] in (3, 4):
        # Convert BGR to GRAY using OpenCV
        return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    raise ValueError(f"Invalid image dimensions for grayscale conversion: {image.shape}")


def apply_gaussian_blur(
    image: np.ndarray,
    kernel_size: Tuple[int, int] = (5, 5),
    sigma_x: float = 1.0
) -> np.ndarray:
    """Applies Gaussian spatial filtering to smooth image and reduce noise.

    Args:
        image (np.ndarray): Input grayscale or color image array.
        kernel_size (Tuple[int, int]): Size of Gaussian kernel tuple (width, height).
        sigma_x (float): Gaussian kernel standard deviation in X direction.

    Returns:
        np.ndarray: Smoothed output image matrix.
    """
    if image is None or image.size == 0:
        raise ValueError("Cannot process empty image array.")

    return cv2.GaussianBlur(image, kernel_size, sigmaX=sigma_x)


def canny_edge_detection(
    image: np.ndarray,
    threshold1: float = 50.0,
    threshold2: float = 150.0
) -> np.ndarray:
    """Applies multi-stage Canny Edge Detection to extract structural boundaries.

    Stages include:
    1. Noise reduction via Gaussian smoothing
    2. Intensity gradient calculation (Sobel operators)
    3. Non-maximum suppression
    4. Hysteresis thresholding

    Args:
        image (np.ndarray): Input single-channel Grayscale or BGR image array.
        threshold1 (float): Lower threshold for hysteresis algorithm.
        threshold2 (float): Upper threshold for hysteresis algorithm.

    Returns:
        np.ndarray: Binary edge map image matrix (255 for edges, 0 for background).
    """
    if image is None or image.size == 0:
        raise ValueError("Cannot process empty image array.")

    # Ensure grayscale input before applying Canny algorithm
    if len(image.shape) == 3:
        gray_image = rgb_to_grayscale(image)
    else:
        gray_image = image

    # Pre-filter using Gaussian blur to suppress noise false positives
    blurred_image = apply_gaussian_blur(gray_image, kernel_size=(5, 5), sigma_x=1.0)

    # Compute Canny edge map
    edges = cv2.Canny(
        blurred_image,
        threshold1=threshold1,
        threshold2=threshold2
    )

    return edges


def run_hello_world_pipeline(
    image: np.ndarray
) -> Dict[str, np.ndarray]:
    """Executes the complete baseline CG/IP Hello World image processing pipeline.

    Workflow:
    1. Validate input image
    2. Convert RGB image to Grayscale
    3. Apply Gaussian spatial smoothing filter
    4. Execute Canny edge detection algorithm

    Args:
        image (np.ndarray): Input synthetic or real BGR image matrix.

    Returns:
        Dict[str, np.ndarray]: Dictionary containing pipeline outputs:
            - 'grayscale': Single-channel grayscale image array.
            - 'blurred': Gaussian blurred image array.
            - 'edges': Canny edge detection result array.
    """
    gray = rgb_to_grayscale(image)
    blurred = apply_gaussian_blur(gray)
    edges = canny_edge_detection(gray)

    return {
        "grayscale": gray,
        "blurred": blurred,
        "edges": edges
    }
