"""Dedicated AI Virtual Try-On Service (IDM-VTON Hugging Face Integration).

Orchestrates asynchronous inference requests to the pretrained yisol/IDM-VTON
Space using gradio_client. Manages thread-safe job tracking, image validation,
temporary file lifecycle, and structured error categorization.
"""

import os
import io
import time
import uuid
import base64
import logging
import threading
from typing import Dict, Any, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor

from PIL import Image
from dotenv import load_dotenv

# Ensure local .env is loaded without printing or leaking secrets
load_dotenv()

logger = logging.getLogger(__name__)

# Maximum file upload size: 16 MB
MAX_IMAGE_SIZE_BYTES = 16 * 1024 * 1024
ALLOWED_FORMATS = {"JPEG", "JPG", "PNG", "WEBP"}
MIN_IMAGE_DIM = 64
MAX_IMAGE_DIM = 4096

# Job expiration: 60 minutes
JOB_TTL_SECONDS = 3600


class IDMValidationError(ValueError):
    """Raised when person or garment payload fails validation."""
    pass


class IDMJobManager:
    """Thread-safe manager for IDM-VTON asynchronous inference jobs."""

    def __init__(self, max_workers: int = 2):
        self._jobs: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()
        self._executor = ThreadPoolExecutor(max_workers=max_workers, thread_name_prefix="idm_vton_worker")
        self._space_name = os.environ.get("IDM_VTON_SPACE", "yisol/IDM-VTON")
        # Token is held only in memory, never exposed via API responses or logs
        self._token: Optional[str] = os.environ.get("HF_TOKEN")

    def get_space_name(self) -> str:
        """Returns the target Hugging Face space identifier."""
        return self._space_name

    def is_token_configured(self) -> bool:
        """Returns True if a non-empty Hugging Face token is loaded."""
        return bool(self._token and len(self._token.strip()) > 5)

    def validate_image_bytes(self, image_bytes: bytes, field_name: str) -> Tuple[str, int, int]:
        """Validates raw image bytes for size, format, and dimension bounds.

        Returns (format_name, width, height).
        Raises IDMValidationError if invalid.
        """
        if not image_bytes or len(image_bytes) == 0:
            raise IDMValidationError(f"Missing or empty payload for '{field_name}'.")

        if len(image_bytes) > MAX_IMAGE_SIZE_BYTES:
            raise IDMValidationError(
                f"Image '{field_name}' exceeds maximum allowed size of 16MB "
                f"({len(image_bytes) / (1024*1024):.2f}MB provided)."
            )

        try:
            with Image.open(io.BytesIO(image_bytes)) as img:
                fmt = (img.format or "").upper()
                if fmt not in ALLOWED_FORMATS:
                    raise IDMValidationError(
                        f"Unsupported format '{fmt}' for '{field_name}'. Accepted formats: JPEG, PNG, WebP."
                    )
                w, h = img.size
                if w < MIN_IMAGE_DIM or h < MIN_IMAGE_DIM:
                    raise IDMValidationError(
                        f"Image '{field_name}' is too small ({w}x{h} px). Minimum dimension: {MIN_IMAGE_DIM}x{MIN_IMAGE_DIM} px."
                    )
                if w > MAX_IMAGE_DIM or h > MAX_IMAGE_DIM:
                    raise IDMValidationError(
                        f"Image '{field_name}' exceeds maximum resolution ({w}x{h} px). Maximum dimension: {MAX_IMAGE_DIM}x{MAX_IMAGE_DIM} px."
                    )
                img.verify()
                return fmt, w, h
        except Exception as e:
            if isinstance(e, IDMValidationError):
                raise
            raise IDMValidationError(f"Invalid or corrupted image data for '{field_name}': {str(e)}") from e

    def submit_job(
        self,
        person_bytes: bytes,
        garment_bytes: bytes,
        garment_description: str = "Upper-body garment",
        category: str = "Tops",
        denoise_steps: int = 30,
        seed: int = 42
    ) -> str:
        """Validates inputs, initializes job record, and submits asynchronous task to pool."""
        # Clean expired jobs
        self._cleanup_expired_jobs()

        # Validate inputs
        self.validate_image_bytes(person_bytes, "person_image")
        self.validate_image_bytes(garment_bytes, "garment_image")

        job_id = str(uuid.uuid4())
        created_at = time.time()

        job_record: Dict[str, Any] = {
            "id": job_id,
            "status": "queued",
            "created_at": created_at,
            "started_at": None,
            "completed_at": None,
            "duration_seconds": None,
            "progress_message": "Job queued for IDM-VTON inference...",
            "garment_category": category,
            "garment_description": garment_description,
            "denoise_steps": denoise_steps,
            "seed": seed,
            "result_image_base64": None,
            "mask_image_base64": None,
            "error": None,
            "error_code": None,
            "model_info": {
                "engine": "IDM-VTON (Diffusion-Based Virtual Try-On)",
                "space": self._space_name,
                "type": "Pretrained Model (Hugging Face Hosted ZeroGPU)"
            }
        }

        with self._lock:
            self._jobs[job_id] = job_record

        # Dispatch async task
        self._executor.submit(
            self._run_job_inference,
            job_id,
            person_bytes,
            garment_bytes,
            garment_description,
            denoise_steps,
            seed
        )

        return job_id

    def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Returns public job status. Pure read operation, never invokes remote API."""
        with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                return None
            # Return shallow copy to avoid concurrent mutation issues
            return dict(job)

    def _update_job(self, job_id: str, **kwargs):
        """Thread-safe update helper."""
        with self._lock:
            if job_id in self._jobs:
                self._jobs[job_id].update(kwargs)

    def _run_job_inference(
        self,
        job_id: str,
        person_bytes: bytes,
        garment_bytes: bytes,
        garment_description: str,
        denoise_steps: int,
        seed: int
    ):
        """Worker thread executing the actual Gradio Client predict call."""
        start_time = time.perf_counter()
        self._update_job(
            job_id,
            status="running",
            started_at=time.time(),
            progress_message="Connecting to Hugging Face IDM-VTON ZeroGPU Space..."
        )

        temp_dir = os.path.abspath(os.path.join("temp", "ai_jobs", job_id))
        os.makedirs(temp_dir, exist_ok=True)

        person_temp_path = os.path.join(temp_dir, "person_input.png")
        garment_temp_path = os.path.join(temp_dir, "garment_input.png")

        try:
            # Write temp input files for Gradio client
            with open(person_temp_path, "wb") as f:
                f.write(person_bytes)
            with open(garment_temp_path, "wb") as f:
                f.write(garment_bytes)

            try:
                from gradio_client import Client, handle_file
            except ImportError:
                raise RuntimeError("gradio_client is not installed in the backend environment.")

            self._update_job(
                job_id,
                progress_message="Waiting for remote ZeroGPU allocation and diffusion denoising..."
            )

            client = Client(self._space_name, token=self._token)

            editor_dict = {
                "background": handle_file(person_temp_path),
                "layers": [],
                "composite": None
            }

            result = client.predict(
                dict=editor_dict,
                garm_img=handle_file(garment_temp_path),
                garment_des=garment_description or "Short sleeve garment",
                is_checked=True,        # Use auto-generated mask
                is_checked_crop=False,    # Keep original resolution/framing
                denoise_steps=denoise_steps,
                seed=seed,
                api_name="/tryon"
            )

            duration = round(time.perf_counter() - start_time, 2)

            # Unpack result
            out_img_path = result[0] if isinstance(result, (list, tuple)) else str(result)
            mask_img_path = result[1] if isinstance(result, (list, tuple)) and len(result) > 1 else None

            # Read result image to base64
            with open(out_img_path, "rb") as f:
                out_bytes = f.read()
            out_b64 = f"data:image/png;base64,{base64.b64encode(out_bytes).decode('ascii')}"

            mask_b64 = None
            if mask_img_path and os.path.exists(mask_img_path):
                with open(mask_img_path, "rb") as f:
                    mask_bytes = f.read()
                mask_b64 = f"data:image/png;base64,{base64.b64encode(mask_bytes).decode('ascii')}"

            self._update_job(
                job_id,
                status="completed",
                completed_at=time.time(),
                duration_seconds=duration,
                progress_message=f"IDM-VTON inference completed in {duration}s",
                result_image_base64=out_b64,
                mask_image_base64=mask_b64
            )

        except Exception as e:
            duration = round(time.perf_counter() - start_time, 2)
            err_str = str(e)
            err_code = self._classify_error(err_str)

            logger.error(f"[IDM-VTON Job {job_id}] Inference failed ({err_code}): {err_str}")

            user_friendly_msg = self._build_friendly_error(err_code, err_str)

            self._update_job(
                job_id,
                status="failed",
                completed_at=time.time(),
                duration_seconds=duration,
                error=user_friendly_msg,
                error_code=err_code,
                progress_message=f"Inference failed: {err_code}"
            )

        finally:
            # Clean up local temporary files
            try:
                if os.path.exists(person_temp_path):
                    os.remove(person_temp_path)
                if os.path.exists(garment_temp_path):
                    os.remove(garment_temp_path)
                if os.path.exists(temp_dir):
                    os.rmdir(temp_dir)
            except Exception as ce:
                logger.warning(f"Failed to clean temporary directory for job {job_id}: {ce}")

    def _classify_error(self, err_str: str) -> str:
        """Categorizes raw Gradio/HuggingFace exceptions into standard error codes."""
        err_lower = err_str.lower()
        if any(w in err_lower for w in ["quota", "rate limit", "exceeded", "zerogpu", "gpu limit"]):
            return "QUOTA_EXHAUSTED"
        if any(w in err_lower for w in ["unauthorized", "401", "invalid token", "forbidden", "403"]):
            return "AUTH_FAILED"
        if any(w in err_lower for w in ["sleeping", "building", "paused", "not found", "404", "space unavailable"]):
            return "SPACE_UNAVAILABLE"
        if any(w in err_lower for w in ["timeout", "timed out", "connection error", "name resolution"]):
            return "NETWORK_ERROR"
        return "INFERENCE_ERROR"

    def _build_friendly_error(self, code: str, raw_err: str) -> str:
        """Constructs actionable, helpful error feedback for students and professors."""
        if code == "QUOTA_EXHAUSTED":
            return (
                "Hugging Face ZeroGPU daily quota for IDM-VTON has been reached. "
                "The Space is currently waiting for quota replenishment. "
                "Classical CG/IP mode remains 100% operational locally."
            )
        if code == "AUTH_FAILED":
            return (
                "Authentication failed with Hugging Face Space. "
                "Check that HF_TOKEN in .env has valid 'read' permissions."
            )
        if code == "SPACE_UNAVAILABLE":
            return (
                "The IDM-VTON Space (yisol/IDM-VTON) is currently paused, building, or unavailable on Hugging Face. "
                "Classical CG/IP mode continues to function normally."
            )
        if code == "NETWORK_ERROR":
            return (
                "Network timeout communicating with Hugging Face servers. "
                "Verify your internet connection and retry."
            )
        return f"AI inference error: {raw_err[:180]}"

    def _cleanup_expired_jobs(self):
        """Removes job entries older than JOB_TTL_SECONDS."""
        now = time.time()
        with self._lock:
            expired_ids = [
                jid for jid, data in self._jobs.items()
                if (now - data.get("created_at", now)) > JOB_TTL_SECONDS
            ]
            for jid in expired_ids:
                del self._jobs[jid]


# Global singleton instance
idm_manager = IDMJobManager(max_workers=2)

