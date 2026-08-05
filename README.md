# Stylinger — AI-Powered Fashion Assistant (CG/IP Academic Project)

[![Python Version](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/downloads/release/python-3120/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Framework](https://img.shields.io/badge/GUI-PyQt5-orange.svg)](https://pypi.org/project/PyQt5/)
[![Computer Vision](https://img.shields.io/badge/CV-OpenCV-red.svg)](https://opencv.org/)

**Stylinger** is an AI-inspired Fashion Assistant application developed as a practical project for the college **Computer Graphics & Image Processing (CG/IP)** course. This project demonstrates fundamental digital image processing operations including synthetic image generation, RGB-to-Grayscale conversion, Gaussian blurring, Canny Edge Detection, and interactive GUI visualization.

---

## 📌 Project Overview

Digital Image Processing forms the foundation of computer vision applications in modern AI-powered fashion technology (e.g., cloth segmentation, pose estimation, virtual try-ons). Stylinger provides a modular, production-ready project framework that executes a baseline **"Hello World"** processing pipeline, demonstrating how raw pixel matrix manipulation interacts with modern desktop GUI frameworks.

---

## 🎯 Objectives

1. **Demonstrate CG/IP Fundamentals**: Showcase digital image representation, color space conversions, spatial filtering, and edge detection.
2. **Modular Architecture**: Implement clean separation of concerns between GUI presentation (`src/gui`), processing algorithms (`src/processing`), and utilities (`src/utils`).
3. **Automated Smoke Testing**: Validate processing pipelines with non-GUI headless unit tests (`tests/test_pipeline.py`).
4. **Extensible AI Architecture**: Prepare clean module interfaces for seamless future integration of MediaPipe (body pose/landmarks) and YOLO (fashion item detection).

---

## ✨ Features

- **Synthetic Image Generation**: Automatically builds a 500x500 RGB synthetic fabric texture with dynamic text overlay (`"Stylinger Pipeline OK"`).
- **RGB to Grayscale Conversion**: Converts 3-channel color images to single-channel luminance intensity using standard ITU-R BT.601 weighted coefficients.
- **Gaussian Spatial Blurring**: Reduces high-frequency noise using a 5x5 Gaussian kernel before edge extraction.
- **Canny Edge Detection**: Detects sharp structural contours and boundaries of fashion items using multi-stage Canny algorithms.
- **Interactive Dual Panel GUI**: Visualizes original and processed images side-by-side in a responsive PyQt5 window with status bars and control buttons.

---

## 📂 Folder Structure

```text
Stylinger/
├── docs/
│   └── architecture.md         # In-depth architectural & Git workflow documentation
├── src/
│   ├── __init__.py
│   ├── gui/
│   │   ├── __init__.py
│   │   └── main_window.py      # PyQt5 dual-panel user interface
│   ├── processing/
│   │   ├── __init__.py
│   │   └── filters.py          # Image filtering & edge detection algorithms
│   ├── utils/
│   │   ├── __init__.py
│   │   └── image_utils.py      # Synthetic image generation & Qt format conversion
│   └── models/
│       └── __init__.py         # Reserved package for future MediaPipe & YOLO integration
├── assets/                     # UI graphics & icons
├── sample_images/              # Test images for filter benchmarks
├── tests/
│   ├── __init__.py
│   └── test_pipeline.py        # Unittest smoke test suite
├── .github/
│   └── PULL_REQUEST_TEMPLATE.md # Standard PR description template
├── .gitignore                  # Git repository exclusion rules
├── requirements.txt            # Project Python dependencies
├── README.md                   # Project documentation manual
└── main.py                     # Primary entry point script
```

---

## 🛠️ Technology Stack

- **Language**: Python 3.12
- **GUI Framework**: PyQt5
- **Image Processing**: OpenCV (`opencv-python`), NumPy
- **Data Visualization**: Matplotlib
- **Testing Framework**: Python `unittest`

---

## ⚙️ Installation & Virtual Environment Setup

### 1. Prerequisites
Ensure Python 3.12 and Git are installed on your system.

### 2. Clone the Repository
```bash
git clone https://github.com/your-username/Stylinger.git
cd Stylinger
```

### 3. Create & Activate Virtual Environment

- **Windows (PowerShell)**:
  ```powershell
  python -m venv venv
  .\venv\Scripts\Activate.ps1
  ```

- **Linux / macOS**:
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```

### 4. Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

---

## 🚀 Running the Project

### Execute GUI Application
To launch the PyQt5 GUI interface and execute the Hello World pipeline:
```bash
python src/main.py
```

### Execute Headless Automated Tests
To run the automated smoke test suite without launching the GUI window:
```bash
python -m unittest discover tests
```

---

## 🔄 Project Workflow

```text
[Input RGB Matrix / Synthetic Image]
                │
                ▼
   [Text Overlay: "Stylinger Pipeline OK"]
                │
                ▼
     [RGB -> Grayscale Conversion]
                │
                ▼
      [5x5 Gaussian Blur Filtering]
                │
                ▼
       [Canny Edge Detection]
                │
                ▼
 [PyQt5 Side-by-Side Dual Rendering]
```

---

## 🌿 Git Workflow

We adhere to standard Feature Branching strategies:

1. **Main Branch**: `main` (Production & releases, protected).
2. **Feature Branches**:
   - `feature/gui` (User interface features)
   - `feature/image-processing` (Computer graphics & filter algorithms)
   - `feature/utils` (Helper utilities & image conversion tools)

### Branch Protection & Commit Guidelines
- Commit messages follow Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`.
- All feature branches require a Pull Request (PR) merged into `main`.

---

## 👥 Contributors

- **Student / Developer**: Senior Computer Science & Engineering Student
- **Course**: Computer Graphics & Image Processing (CG/IP)
- **Instructor / Evaluator**: Department of Computer Science

---

## 🔮 Future Scope

- **MediaPipe Integration**: Real-time human body pose estimation and landmark tracking for garment fitting.
- **YOLO Garment Detection**: Automatic detection and bounding box classification of clothes (t-shirts, trousers, dresses).
- **Virtual Try-On (VTON)**: Advanced image warping and deep learning overlay for virtual outfit try-on.
