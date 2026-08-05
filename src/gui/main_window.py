"""Main Window GUI Module for Stylinger.

Implements the primary PyQt5 desktop window interface, rendering side-by-side
original and processed images, control buttons, status bars, and event hooks.
"""

import sys
import numpy as np
from PyQt5.QtWidgets import (
    QMainWindow,
    QWidget,
    QLabel,
    QPushButton,
    QHBoxLayout,
    QVBoxLayout,
    QGroupBox,
    QStatusBar,
    QMessageBox,
    QApplication
)
from PyQt5.QtCore import Qt
from PyQt5.QtGui import QFont, QIcon

from utils.image_utils import (
    create_synthetic_image,
    draw_text_overlay,
    cv2_to_qpixmap
)
from processing.filters import run_hello_world_pipeline


class MainWindow(QMainWindow):
    """Primary PyQt5 Graphical User Interface Window for Stylinger.

    Provides interactive dual-panel visualization for displaying original
    and processed images side-by-side alongside pipeline control buttons.
    """

    def __init__(self) -> None:
        """Initializes the MainWindow user interface layout and state."""
        super().__init__()

        # Image state storage (OpenCV BGR NumPy matrices)
        self.original_image: np.ndarray = None
        self.processed_image: np.ndarray = None

        self._init_ui()

    def _init_ui(self) -> None:
        """Constructs and positions UI widgets, layouts, and window properties."""
        self.setWindowTitle("Stylinger — AI Fashion Assistant (CG/IP Hello World Pipeline)")
        self.setGeometry(100, 100, 1100, 700)

        # Central Widget & Main Vertical Layout
        central_widget = QWidget(self)
        self.setCentralWidget(central_widget)
        main_layout = QVBoxLayout(central_widget)
        main_layout.setContentsMargins(20, 20, 20, 20)
        main_layout.setSpacing(15)

        # Header Title Banner
        header_label = QLabel("Stylinger: Computer Graphics & Image Processing Studio")
        header_font = QFont("Arial", 16, QFont.Bold)
        header_label.setFont(header_font)
        header_label.setAlignment(Qt.AlignCenter)
        header_label.setStyleSheet("color: #2C3E50; margin-bottom: 10px;")
        main_layout.addWidget(header_label)

        # Dual Image View Panel Layout (Horizontal Split)
        view_layout = QHBoxLayout()
        view_layout.setSpacing(20)

        # Left GroupBox: Original Image Panel
        left_box = QGroupBox("Original Input Matrix (Synthetic Image + Overlay)")
        left_box.setFont(QFont("Arial", 10, QFont.Bold))
        left_layout = QVBoxLayout(left_box)

        self.label_original = QLabel()
        self.label_original.setAlignment(Qt.AlignCenter)
        self.label_original.setMinimumSize(480, 480)
        self.label_original.setText("Click 'Generate Sample Image' to start")
        self.label_original.setStyleSheet(
            "background-color: #ECF0F1; border: 2px dashed #BDC3C7; border-radius: 8px;"
        )
        left_layout.addWidget(self.label_original)
        view_layout.addWidget(left_box)

        # Right GroupBox: Processed Image Panel
        right_box = QGroupBox("Processed Matrix (Canny Edge Detection Filter)")
        right_box.setFont(QFont("Arial", 10, QFont.Bold))
        right_layout = QVBoxLayout(right_box)

        self.label_processed = QLabel()
        self.label_processed.setAlignment(Qt.AlignCenter)
        self.label_processed.setMinimumSize(480, 480)
        self.label_processed.setText("Click 'Run Pipeline' to process image")
        self.label_processed.setStyleSheet(
            "background-color: #ECF0F1; border: 2px dashed #BDC3C7; border-radius: 8px;"
        )
        right_layout.addWidget(self.label_processed)
        view_layout.addWidget(right_box)

        main_layout.addLayout(view_layout)

        # Controls Button Layout (Horizontal Row)
        button_layout = QHBoxLayout()
        button_layout.setSpacing(15)

        self.btn_generate = QPushButton("🎨 Generate Sample Image")
        self.btn_generate.setFont(QFont("Arial", 10, QFont.Bold))
        self.btn_generate.setStyleSheet(
            "QPushButton { background-color: #2980B9; color: white; padding: 10px 20px; border-radius: 6px; }"
            "QPushButton:hover { background-color: #3498DB; }"
        )
        self.btn_generate.clicked.connect(self.on_generate_image)
        button_layout.addWidget(self.btn_generate)

        self.btn_pipeline = QPushButton("⚡ Run Pipeline")
        self.btn_pipeline.setFont(QFont("Arial", 10, QFont.Bold))
        self.btn_pipeline.setStyleSheet(
            "QPushButton { background-color: #27AE60; color: white; padding: 10px 20px; border-radius: 6px; }"
            "QPushButton:hover { background-color: #2ECC71; }"
        )
        self.btn_pipeline.clicked.connect(self.on_run_pipeline)
        button_layout.addWidget(self.btn_pipeline)

        self.btn_exit = QPushButton("❌ Exit")
        self.btn_exit.setFont(QFont("Arial", 10, QFont.Bold))
        self.btn_exit.setStyleSheet(
            "QPushButton { background-color: #C0392B; color: white; padding: 10px 20px; border-radius: 6px; }"
            "QPushButton:hover { background-color: #E74C3C; }"
        )
        self.btn_exit.clicked.connect(self.on_exit)
        button_layout.addWidget(self.btn_exit)

        main_layout.addLayout(button_layout)

        # Bottom Status Bar Feedback
        self.status_bar = QStatusBar()
        self.setStatusBar(self.status_bar)
        self.status_bar.showMessage("Ready. System initialized successfully.")

        # Auto-generate baseline synthetic image on program launch
        self.on_generate_image()

    def on_generate_image(self) -> None:
        """Generates a synthetic RGB image with text overlay and renders it in GUI."""
        try:
            # 1. Create 500x500 base image matrix
            raw_image = create_synthetic_image(height=500, width=500)

            # 2. Draw text overlay required by Hello World pipeline specs
            self.original_image = draw_text_overlay(
                image=raw_image,
                text="Stylinger Pipeline OK",
                position=(30, 260),
                font_scale=0.9,
                color=(40, 40, 200),
                thickness=2
            )

            # 3. Convert NumPy array to PyQt QPixmap and render
            pixmap = cv2_to_qpixmap(self.original_image)
            self.label_original.setPixmap(pixmap)
            self.status_bar.showMessage("Generated synthetic image matrix with text 'Stylinger Pipeline OK'.")

        except Exception as err:
            QMessageBox.critical(self, "Image Generation Error", f"Failed to generate sample image:\n{err}")
            self.status_bar.showMessage("Error generating sample image.")

    def on_run_pipeline(self) -> None:
        """Executes Grayscale, Gaussian Blur, and Canny Edge Detection algorithms."""
        if self.original_image is None:
            QMessageBox.warning(self, "No Image Loaded", "Please generate a sample image first!")
            return

        try:
            # Execute processing filter module pipeline
            results = run_hello_world_pipeline(self.original_image)
            self.processed_image = results["edges"]

            # Convert single channel edge map to QPixmap for rendering
            pixmap = cv2_to_qpixmap(self.processed_image)
            self.label_processed.setPixmap(pixmap)

            self.status_bar.showMessage(
                "Pipeline Executed Successfully: RGB -> Grayscale -> Gaussian Blur -> Canny Edge Detection OK."
            )

        except Exception as err:
            QMessageBox.critical(self, "Processing Error", f"Failed to run image processing pipeline:\n{err}")
            self.status_bar.showMessage("Error during image processing pipeline.")

    def on_exit(self) -> None:
        """Gracefully closes the GUI application window."""
        self.close()


def main() -> None:
    """Helper entry function for testing GUI module standalone."""
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec_())


if __name__ == "__main__":
    main()
