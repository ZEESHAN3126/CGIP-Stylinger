# Stylinger — Application Data Structures & Schemas (schema.md)

**Document Status:** Approved Data Schema  
**Project:** Stylinger — Virtual Fashion Styling using Computer Graphics and Image Processing  
**Scope:** In-Memory, REST API Payloads, and JSON Configuration Schemas (No Database)  

---

## 1. Architectural Scope

Stylinger is an educational computer vision laboratory that operates **without an external or persistent SQL/NoSQL database**. All runtime states are maintained via:
1. **Lightweight Python Dataclasses / TypedDicts** in backend memory.
2. **Ephemeral File System Sessions** in `temp/sessions/<session_id>/`.
3. **Static JSON Configuration Registries** in `assets/garments/garments.json`.
4. **Standardized REST JSON Payloads** between the Flask API and frontend JavaScript.

---

## 2. In-Memory Python Data Structures

### 2.1 User Image Metadata
Represents an uploaded portrait decoded and validated by the backend.

```python
from dataclasses import dataclass
from typing import Tuple, Optional

@dataclass
class UserImageMetadata:
    """Metadata for an uploaded user portrait."""
    session_id: str                # UUID4 unique session identifier
    original_filename: str         # Sanitized upload filename
    format: str                    # Detected file extension ('png', 'jpg', 'webp')
    raw_dimensions: Tuple[int, int]# (height, width) of uploaded image in pixels
    working_dimensions: Tuple[int, int] # (height, width) after scaling normalization
    channels: int                  # Channel count (typically 3 for BGR)
    file_size_bytes: int           # Raw byte length of uploaded file
    storage_path: str              # Path to cached raw image: 'temp/sessions/<id>/original.png'
```

---

### 2.2 Body-Region Geometry & Anchor Points
Represents detected geometric landmarks derived from contour and scanline analysis.

```python
from typing import Tuple, TypedDict

class Point2D(TypedDict):
    x: int
    y: int

class BodyRegionGeometry(TypedDict):
    """Estimated body coordinates extracted via classical contour analysis."""
    left_shoulder: Point2D        # (x, y) anchor at subject's left shoulder inflection
    right_shoulder: Point2D       # (x, y) anchor at subject's right shoulder inflection
    neck_center: Point2D          # (x, y) anchor at base of neck / collar line
    torso_bottom: Point2D         # (x, y) anchor at bottom of estimated torso / waist
    shoulder_width_px: int        # Euclidean distance between left and right shoulders
    torso_height_px: int          # Distance between neck center and torso bottom
    confidence_metric: float      # Heuristic score based on contour completeness [0.0 - 1.0]
```

---

### 2.3 Garment Catalog Metadata
Represents static apparel items registered in `assets/garments/garments.json`.

```python
from dataclasses import dataclass
from typing import Dict, List

@dataclass
class GarmentAnchorPoints:
    """Intrinsic landmark coordinates on the garment asset itself."""
    left_shoulder: Point2D        # (x, y) position on garment PNG
    right_shoulder: Point2D       # (x, y) position on garment PNG
    neck_center: Point2D          # (x, y) position at garment collar center
    hem_center: Point2D           # (x, y) position at garment bottom center

@dataclass
class GarmentCatalogItem:
    """Definition of a curated garment asset in the catalog."""
    id: str                       # Unique slug (e.g., 'tshirt_black_crew')
    name: str                     # Human-readable title ('Classic Black Crewneck')
    category: str                 # 'tshirts' | 'shirts' | 'jackets' | 'tops'
    thumbnail_url: str            # Relative path to gallery thumbnail
    asset_path: str               # Path to high-res transparent 4-channel RGBA PNG
    native_dimensions: Tuple[int, int] # (height, width) of source asset
    anchors: GarmentAnchorPoints  # Reference landmark coordinates
    color_family: str             # Dominant color family ('black', 'white', 'blue')
    description: str              # Short styling description
```

---

### 2.4 Transformation & Fine-Tuning Parameters
Represents user-guided micro-adjustments and the resulting affine transformation matrix.

```python
from dataclasses import dataclass
import numpy as np

@dataclass
class FineTuneParameters:
    """User-guided spatial micro-adjustments applied to garment alignment."""
    offset_x: int = 0             # Horizontal translation adjustment in pixels
    offset_y: int = 0             # Vertical translation adjustment in pixels
    scale_factor: float = 1.0     # Proportional scaling factor [0.80 - 1.25]
    rotation_deg: float = 0.0     # Minor rotation offset in degrees [-15.0 - 15.0]

@dataclass
class AffineTransformationState:
    """Calculated 2D affine mapping state."""
    matrix_2x3: np.ndarray        # 2x3 Affine transformation matrix (dtype=float32)
    source_anchors: np.ndarray    # 3x2 array of source garment points
    destination_anchors: np.ndarray # 3x2 array of target body points
    target_canvas_size: Tuple[int, int] # (width, height) matching subject frame
```

---

### 2.5 Processing Result & Pipeline Artifact Metadata
Represents intermediate and final outputs produced during pipeline execution.

```python
from typing import TypedDict, List

class PipelineStageArtifact(TypedDict):
    """Metadata for an inspectable intermediate processing step."""
    stage_id: str                 # 'grayscale', 'hsv_mask', 'canny_edges', etc.
    display_title: str            # 'Canny Edge Map (Threshold 50/150)'
    description: str              # Algorithmic description for educational inspection
    image_url: str                # Endpoint URL to fetch stage matrix preview
    dimensions: Tuple[int, int]   # Matrix shape (height, width)
    channels: int                 # Channel count (1 for binary/gray, 3 for BGR)

class PipelineExecutionResult(TypedDict):
    """Summary payload returned after garment styling."""
    session_id: str
    garment_id: str
    execution_time_ms: int
    composite_image_url: str
    download_url: str
    detected_anchors: BodyRegionGeometry
    stages: List[PipelineStageArtifact]
```

---

## 3. JSON Configuration & Wire Payloads

### 3.1 `assets/garments/garments.json` Schema
Standardized configuration file for registering apparel assets:

```json
{
  "version": "1.0",
  "categories": [
    { "id": "tshirts", "name": "T-Shirts & Tops" },
    { "id": "jackets", "name": "Jackets & Outerwear" }
  ],
  "garments": [
    {
      "id": "tshirt_black_crew",
      "name": "Classic Black Crewneck",
      "category": "tshirts",
      "asset_file": "tshirts/tshirt_black_crew.png",
      "native_dimensions": { "width": 800, "height": 900 },
      "anchors": {
        "left_shoulder": { "x": 230, "y": 140 },
        "right_shoulder": { "x": 570, "y": 140 },
        "neck_center": { "x": 400, "y": 110 },
        "hem_center": { "x": 400, "y": 820 }
      },
      "color_family": "black",
      "description": "Fitted heavyweight cotton crewneck in deep obsidian black."
    },
    {
      "id": "tshirt_white_vneck",
      "name": "Minimalist White V-Neck",
      "category": "tshirts",
      "asset_file": "tshirts/tshirt_white_vneck.png",
      "native_dimensions": { "width": 800, "height": 900 },
      "anchors": {
        "left_shoulder": { "x": 225, "y": 145 },
        "right_shoulder": { "x": 575, "y": 145 },
        "neck_center": { "x": 400, "y": 130 },
        "hem_center": { "x": 400, "y": 815 }
      },
      "color_family": "white",
      "description": "Relaxed fit organic cotton v-neck in optical white."
    },
    {
      "id": "denim_jacket_blue",
      "name": "Vintage Washed Denim Jacket",
      "category": "jackets",
      "asset_file": "jackets/denim_jacket_blue.png",
      "native_dimensions": { "width": 850, "height": 950 },
      "anchors": {
        "left_shoulder": { "x": 210, "y": 150 },
        "right_shoulder": { "x": 640, "y": 150 },
        "neck_center": { "x": 425, "y": 120 },
        "hem_center": { "x": 425, "y": 860 }
      },
      "color_family": "blue",
      "description": "Tailored vintage denim jacket with structured shoulders."
    }
  ]
}
```

---

### 3.2 REST API Error Response Schema
Standardized error format returned across all API endpoints:

```json
{
  "success": false,
  "error": {
    "code": "CORRUPTED_IMAGE",
    "message": "The uploaded file could not be decoded as a valid image matrix.",
    "status_code": 422,
    "details": {
      "filename": "damaged_file.jpg",
      "remedy": "Ensure the file is an uncorrupted JPEG, PNG, or WEBP image."
    }
  }
}
```
