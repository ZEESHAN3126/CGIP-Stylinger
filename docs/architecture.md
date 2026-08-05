# Stylinger — System Architecture & Developer Guide

## 1. Architectural Overview

Stylinger is structured around the **Model-View-Controller (MVC)** and **Layered Architecture** design patterns to decouple raw digital image processing algorithms from the desktop GUI presentation layer.

```text
┌─────────────────────────────────────────────────────────┐
│                    main.py (Launcher)                   │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│                  src/gui/main_window.py                 │
│              (PyQt5 Presentation View Layer)            │
└──────────────┬───────────────────────────┬──────────────┘
               │                           │
               ▼                           ▼
┌──────────────────────────────┐ ┌────────────────────────┐
│   src/utils/image_utils.py   │ │ src/processing/filters │
│ (Data Conversion & Synthetic)│ │  (Digital Image Logic) │
└──────────────────────────────┘ └────────────────────────┘
```

---

## 2. Module Communication Protocol

1. **`main.py`**: Initializes the global `QApplication` event loop and instantiates `MainWindow`.
2. **`src/gui/main_window.py`**:
   - Invokes `src.utils.image_utils.create_synthetic_image()` to build a 500x500 RGB matrix.
   - Calls `src.utils.image_utils.draw_text_overlay()` to render `"Stylinger Pipeline OK"`.
   - Converts OpenCV BGR NumPy matrices into PyQt `QPixmap` instances using `cv2_to_qpixmap()` for UI display.
   - When the user clicks **"Run Pipeline"**, passes the image matrix to `src.processing.filters.run_hello_world_pipeline()`.
3. **`src/processing/filters.py`**:
   - `rgb_to_grayscale()`: Converts 3-channel color image to 1-channel luminance matrix.
   - `apply_gaussian_blur()`: Filters out high-frequency spatial noise with a 5x5 kernel.
   - `canny_edge_detection()`: Detects structural contours and outputs a binary edge map.

---

## 3. Platform Setup Guide

### 🪟 Windows Setup (PowerShell)
```powershell
# 1. Clone repository
git clone https://github.com/your-username/Stylinger.git
cd "CGIP- Stylinger"

# 2. Create Python 3.12 Virtual Environment
python -m venv venv

# 3. Activate Virtual Environment
.\venv\Scripts\Activate.ps1

# 4. Upgrade pip & install dependencies
python -m pip install --upgrade pip
pip install -r requirements.txt

# 5. Run GUI Application
python src/main.py

# 6. Run Automated Smoke Tests
python -m unittest discover tests
```

### 🐧 Linux Setup (Ubuntu / Debian / Fedora)
```bash
# 1. Install system OpenGL dependencies for PyQt5 & OpenCV
sudo apt update
sudo apt install -y python3-venv python3-pip libgl1-mesa-glx libglib2.0-0

# 2. Clone repository & Navigate
git clone https://github.com/your-username/Stylinger.git
cd "CGIP- Stylinger"

# 3. Create & Activate Virtual Environment
python3 -m venv venv
source venv/bin/activate

# 4. Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# 5. Run GUI Application
python src/main.py

# 6. Run Automated Smoke Tests
python -m unittest discover tests
```

### 🍎 macOS Setup (Intel / Apple Silicon)
```bash
# 1. Clone repository & Navigate
git clone https://github.com/your-username/Stylinger.git
cd "CGIP- Stylinger"

# 2. Create & Activate Virtual Environment
python3 -m venv venv
source venv/bin/activate

# 3. Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# 4. Run Application
python src/main.py

# 5. Run Automated Smoke Tests
python -m unittest discover tests
```

---

## 4. Git & GitHub DevOps Strategy

### Branch Naming Conventions
- **`main`**: Production-ready code. Protected branch.
- **`feature/gui`**: User interface components & Qt layout additions.
- **`feature/image-processing`**: Digital image algorithms, filters, edge detectors.
- **`feature/utils`**: Image format converters & data generation utilities.
- **`docs/architecture`**: Documentation & setup guides.

### Complete Git Command Execution Flow

#### Step A: Initialize Repository & Remote
```bash
git init
git remote add origin https://github.com/your-username/Stylinger.git
```

#### Step B: Feature Branch 1 — `feature/utils`
```bash
git checkout -b feature/utils
git add src/utils/
git commit -m "feat(utils): add synthetic image generator and cv2 to qpixmap converter"
git push -u origin feature/utils
```

#### Step C: Feature Branch 2 — `feature/image-processing`
```bash
git checkout -b feature/image-processing
git add src/processing/
git commit -m "feat(processing): implement grayscale conversion and Canny edge detection pipeline"
git push -u origin feature/image-processing
```

#### Step D: Feature Branch 3 — `feature/gui`
```bash
git checkout -b feature/gui
git add src/gui/ main.py
git commit -m "feat(gui): implement PyQt5 dual panel window and main entry point"
git push -u origin feature/gui
```

#### Step E: Create Pull Request & Merge into `main`
```bash
# Checkout main branch and merge feature branches
git checkout main
git merge feature/utils
git merge feature/image-processing
git merge feature/gui
git push origin main
```

---

## 5. Code Quality & Standards

- **PEP 8 Compliance**: Strict adherence to line lengths, naming conventions, and whitespace.
- **Type Annotations**: All function signatures use Python `typing` standard hints (`Tuple`, `Dict`, `np.ndarray`).
- **Docstrings**: Formatted according to Google Python Docstring conventions.
- **Zero Placeholders**: Every file is fully functional and runnable out of the box.
