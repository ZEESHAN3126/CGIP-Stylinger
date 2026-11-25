"""Web and REST API Routing Module for Stylinger Studio.

Defines blueprint routes for the main web studio single-page presentation,
health/status endpoints, and a transparent proxy to the tryon-service
running on localhost:5001 (classical CG/IP pipeline).
"""

import os
from typing import Dict, Any, List, Optional
import base64

import requests as _http
from flask import Blueprint, render_template, jsonify, current_app, request, Response

from src.web.services.idm_vton import idm_manager, IDMValidationError

main_bp = Blueprint("main", __name__)
api_bp = Blueprint("api", __name__)

# ---------------------------------------------------------------------------
# Tryon-service base URL — can be overridden via environment variable
# ---------------------------------------------------------------------------
TRYON_SERVICE_BASE = os.environ.get("TRYON_SERVICE_URL", "http://127.0.0.1:5001")

# ---------------------------------------------------------------------------
# Authoritative pipeline stage definitions for visual representation
# ---------------------------------------------------------------------------
PIPELINE_STAGES: List[Dict[str, Any]] = [
    {
        "id": "upload",
        "step": "01",
        "title": "Image Ingestion",
        "algorithm": "Validation & Resolution Calibration",
        "status": "inactive",
        "phase": "Phase 2"
    },
    {
        "id": "preprocess",
        "step": "02",
        "title": "Preprocessing",
        "algorithm": "Gaussian & Bilateral Denoising",
        "status": "inactive",
        "phase": "Phase 3"
    },
    {
        "id": "hsv",
        "step": "03",
        "title": "Color Slicing",
        "algorithm": "RGB → HSV Cylindrical Transform",
        "status": "inactive",
        "phase": "Phase 4"
    },
    {
        "id": "segment",
        "step": "04",
        "title": "Segmentation",
        "algorithm": "GrabCut + Dual HSV Skin Mask",
        "status": "inactive",
        "phase": "Phase 4"
    },
    {
        "id": "morphology",
        "step": "05",
        "title": "Morphological Cleanup",
        "algorithm": "Opening (Erosion) & Closing (Dilation)",
        "status": "inactive",
        "phase": "Phase 5"
    },
    {
        "id": "contours",
        "step": "06",
        "title": "Contour & Edges",
        "algorithm": "Canny Gradient & Silhouette Hierarchy",
        "status": "inactive",
        "phase": "Phase 5"
    },
    {
        "id": "anchors",
        "step": "07",
        "title": "Body Estimation",
        "algorithm": "Scanline Inflection & Shoulder Anchors",
        "status": "inactive",
        "phase": "Phase 6"
    },
    {
        "id": "transform",
        "step": "08",
        "title": "2D Affine Warping",
        "algorithm": "3-Point Matrix Mapping (cv2.warpAffine)",
        "status": "inactive",
        "phase": "Phase 9"
    },
    {
        "id": "composite",
        "step": "09",
        "title": "Alpha Compositing",
        "algorithm": "Gaussian Feathering & Convex Blending",
        "status": "inactive",
        "phase": "Phase 10"
    },
    {
        "id": "compare",
        "step": "10",
        "title": "Interactive Studio",
        "algorithm": "Split-Screen Curtain & Inspector",
        "status": "inactive",
        "phase": "Phase 11"
    }
]

# Garment catalog with category labels matching the tryon-service API
CATALOG_ITEMS: List[Dict[str, Any]] = [
    {
        "id": "cat_tshirt",
        "name": "Classic Crewneck",
        "category": "T-Shirt",
        "api_category": "T-Shirt",
        "palette": "Obsidian Black",
        "description": "Heavyweight cotton silhouette with predefined shoulder anchors."
    },
    {
        "id": "cat_vneck",
        "name": "Minimalist V-Neck",
        "category": "T-Shirt",
        "api_category": "T-Shirt",
        "palette": "Optical White",
        "description": "Relaxed drape top with collar centerline reference point."
    },
    {
        "id": "cat_jacket",
        "name": "Tailored Outerwear",
        "category": "Jacket",
        "api_category": "Jacket",
        "palette": "Indigo Denim",
        "description": "Structured shoulder jacket calibrated for 3-point affine alignment."
    },
    {
        "id": "cat_shirt",
        "name": "Oxford Dress Shirt",
        "category": "Shirt",
        "api_category": "Shirt",
        "palette": "Slate Blue",
        "description": "Formal button-down, collar anchor & shoulder width profiling."
    },
    {
        "id": "cat_jeans",
        "name": "Slim Fit Denim",
        "category": "Jeans",
        "api_category": "Jeans",
        "palette": "Washed Indigo",
        "description": "Lower-body fitting via waist-to-ankle scanline projection."
    },
    {
        "id": "cat_dress",
        "name": "Midi Shift Dress",
        "category": "Dress",
        "api_category": "Dress",
        "palette": "Champagne Ivory",
        "description": "Full-body overlay using torso-to-knee affine warp chain."
    },
]


# ===========================================================================
# Main Web Studio Route
# ===========================================================================

@main_bp.route("/", methods=["GET"])
def studio_index():
    """Serves the primary Stylinger Web Studio single-page interface."""
    return render_template(
        "index.html",
        studio_name=current_app.config["STUDIO_NAME"],
        studio_tagline=current_app.config["STUDIO_TAGLINE"],
        academic_scope=current_app.config["ACADEMIC_SCOPE"],
        pipeline_stages=PIPELINE_STAGES,
        catalog_items=CATALOG_ITEMS,
        current_phase="Phase 2 — Virtual Try-On Studio"
    )


# ===========================================================================
# Studio API — Health & Status
# ===========================================================================

@api_bp.route("/health", methods=["GET"])
def api_health():
    """Health and status telemetry endpoint for the Stylinger web studio."""
    # Probe the tryon-service
    tryon_online = False
    tryon_version = None
    try:
        probe = _http.get(f"{TRYON_SERVICE_BASE}/api/health", timeout=1.5)
        if probe.ok:
            tryon_online = True
            tryon_version = probe.json().get("opencv_version")
    except Exception:
        pass

    return jsonify({
        "status": "healthy",
        "service": "Stylinger Web Studio",
        "version": "2.0.0-integration",
        "phase": "Phase 2 — Virtual Try-On Studio (Classical CG/IP + IDM-VTON)",
        "academic_scope": "Classical CG/IP (OpenCV + NumPy) & IDM-VTON AI Comparison",
        "framework": "Flask 3.x",
        "tryon_service": {
            "online": tryon_online,
            "url": TRYON_SERVICE_BASE,
            "opencv_version": tryon_version,
        },
        "ai_service": {
            "engine": "IDM-VTON",
            "space": idm_manager.get_space_name(),
            "token_configured": idm_manager.is_token_configured(),
            "type": "Pretrained Generative Diffusion (Hugging Face ZeroGPU)"
        },
        "active_constraints": [
            "Deterministic Classical DIP Engine (Local)",
            "Pretrained Diffusion AI Engine (ZeroGPU Cloud)",
            "Zero Database Overhead",
            "Side-by-Side Dual Engine Comparison"
        ]
    }), 200


# ===========================================================================
# Transparent Proxy to Tryon-Service (port 5001)
# Forwards /api/tryon/* → http://127.0.0.1:5001/api/tryon/*
# ===========================================================================

def _forward_to_tryon(sub_path: str):
    """Internal helper: proxy a request to the tryon-service and return the response."""
    target_url = f"{TRYON_SERVICE_BASE}/api/tryon/{sub_path}"

    # Build proxied headers (strip hop-by-hop headers)
    hop_by_hop = {
        "connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
        "te", "trailers", "transfer-encoding", "upgrade", "host"
    }
    fwd_headers = {
        k: v for k, v in request.headers if k.lower() not in hop_by_hop
    }

    try:
        # Forward the full request including files and form data
        if request.files:
            # Multipart upload — rebuild files dict
            files = {}
            for field_name, file_storage in request.files.items():
                files[field_name] = (
                    file_storage.filename,
                    file_storage.read(),
                    file_storage.mimetype
                )
            data = request.form.to_dict()
            resp = _http.request(
                method=request.method,
                url=target_url,
                files=files,
                data=data,
                timeout=45,
            )
        elif request.is_json:
            resp = _http.request(
                method=request.method,
                url=target_url,
                json=request.get_json(silent=True),
                headers=fwd_headers,
                timeout=45,
            )
        else:
            resp = _http.request(
                method=request.method,
                url=target_url,
                data=request.get_data(),
                headers=fwd_headers,
                timeout=45,
            )

        # Stream response back
        excluded_resp_headers = {
            "content-encoding", "transfer-encoding", "connection", "content-length"
        }
        proxy_headers = [
            (k, v) for k, v in resp.headers.items()
            if k.lower() not in excluded_resp_headers
        ]
        return Response(
            resp.content,
            status=resp.status_code,
            headers=proxy_headers,
            content_type=resp.headers.get("Content-Type", "application/json")
        )

    except _http.exceptions.ConnectionError:
        return jsonify({
            "success": False,
            "error": {
                "code": "TRYON_SERVICE_OFFLINE",
                "message": (
                    "The Virtual Try-On service is not running. "
                    "Start it with: cd tryon-service && python app.py"
                ),
                "status_code": 503
            }
        }), 503
    except _http.exceptions.Timeout:
        return jsonify({
            "success": False,
            "error": {
                "code": "TRYON_SERVICE_TIMEOUT",
                "message": "The Virtual Try-On service took too long to respond.",
                "status_code": 504
            }
        }), 504


# ===========================================================================
# AI Virtual Try-On API Endpoints (IDM-VTON Integration)
# ===========================================================================

def _extract_image_bytes(file_key: str, b64_key: str) -> Optional[bytes]:
    """Extracts raw bytes from either multipart upload or base64 data string."""
    # 1. Direct file upload
    if file_key in request.files:
        f = request.files[file_key]
        if f and f.filename:
            content = f.read()
            if content and len(content) > 0:
                return content

    # 2. Base64 payload in form or JSON
    raw_b64 = None
    if request.is_json and request.json:
        raw_b64 = request.json.get(b64_key)
    elif request.form.get(b64_key):
        raw_b64 = request.form.get(b64_key)

    if raw_b64 and isinstance(raw_b64, str):
        if "base64," in raw_b64:
            raw_b64 = raw_b64.split("base64,")[1]
        try:
            return base64.b64decode(raw_b64)
        except Exception as err:
            raise IDMValidationError(f"Invalid base64 payload for '{b64_key}': {str(err)}")

    return None


@api_bp.route("/tryon/ai/jobs", methods=["POST"])
def create_ai_tryon_job():
    """Submits an asynchronous Virtual Try-On request to the IDM-VTON Hugging Face Space."""
    try:
        person_bytes = _extract_image_bytes("person_image", "person_image_base64")
        if not person_bytes:
            # Fallback to alternate param names if provided
            person_bytes = _extract_image_bytes("user_image", "user_image_base64")

        garment_bytes = _extract_image_bytes("garment_image", "garment_image_base64")

        if not person_bytes:
            return jsonify({
                "success": False,
                "error": {
                    "code": "MISSING_PERSON_IMAGE",
                    "message": "Missing person image. Please provide 'person_image' file or 'person_image_base64'."
                }
            }), 400

        if not garment_bytes:
            return jsonify({
                "success": False,
                "error": {
                    "code": "MISSING_GARMENT_IMAGE",
                    "message": "Missing garment image. Please provide 'garment_image' file or 'garment_image_base64'."
                }
            }), 400

        # Read optional parameters
        category = "Tops"
        garment_desc = "Short sleeve upper-body garment"
        denoise_steps = 30
        seed = 42

        if request.is_json and request.json:
            category = request.json.get("category", category)
            garment_desc = request.json.get("garment_description", garment_desc)
            denoise_steps = int(request.json.get("denoise_steps", denoise_steps))
            seed = int(request.json.get("seed", seed))
        elif request.form:
            category = request.form.get("category", category)
            garment_desc = request.form.get("garment_description", garment_desc)
            if request.form.get("denoise_steps"):
                try:
                    denoise_steps = int(request.form.get("denoise_steps"))
                except ValueError:
                    pass
            if request.form.get("seed"):
                try:
                    seed = int(request.form.get("seed"))
                except ValueError:
                    pass

        job_id = idm_manager.submit_job(
            person_bytes=person_bytes,
            garment_bytes=garment_bytes,
            garment_description=garment_desc,
            category=category,
            denoise_steps=denoise_steps,
            seed=seed
        )

        return jsonify({
            "success": True,
            "job_id": job_id,
            "status": "queued",
            "message": "AI Virtual Try-On job queued for IDM-VTON remote inference.",
            "poll_url": f"/api/tryon/ai/jobs/{job_id}"
        }), 202

    except IDMValidationError as ve:
        return jsonify({
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": str(ve)
            }
        }), 400
    except Exception as e:
        return jsonify({
            "success": False,
            "error": {
                "code": "SUBMISSION_ERROR",
                "message": f"Failed to submit AI try-on job: {str(e)}"
            }
        }), 500


@api_bp.route("/tryon/ai/jobs/<job_id>", methods=["GET"])
def get_ai_tryon_job(job_id: str):
    """Retrieves current processing status or final composite for an AI try-on job."""
    job = idm_manager.get_job_status(job_id)
    if not job:
        return jsonify({
            "success": False,
            "error": {
                "code": "JOB_NOT_FOUND",
                "message": f"AI try-on job '{job_id}' does not exist or has expired."
            }
        }), 404

    return jsonify({
        "success": True,
        "job": job
    }), 200


# ===========================================================================
# Transparent Proxy to Tryon-Service (port 5001)
# Forwards /api/tryon/* → http://127.0.0.1:5001/api/tryon/*
# ===========================================================================

@api_bp.route("/tryon/<path:sub_path>", methods=["GET", "POST", "OPTIONS"])
def proxy_tryon(sub_path: str):
    """Transparent proxy: forwards all non-AI /api/tryon/* requests to the tryon-service."""
    if sub_path.startswith("ai/"):
        return jsonify({
            "success": False,
            "error": {
                "code": "NOT_FOUND",
                "message": "Invalid AI endpoint."
            }
        }), 404
    return _forward_to_tryon(sub_path)
