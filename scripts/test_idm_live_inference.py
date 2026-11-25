"""Real live inference test for IDM-VTON Space.

Submits actual person and garment images to yisol/IDM-VTON,
measures the exact GPU inference duration, saves the real generated
composite image to disk, and verifies return contracts.
"""

import os
import sys
import time
import shutil
from dotenv import load_dotenv

load_dotenv()

space = os.environ.get("IDM_VTON_SPACE", "yisol/IDM-VTON")
token = os.environ.get("HF_TOKEN")

print(f"[*] Target Space: {space}")
print(f"[*] Token configured: {bool(token and len(token) > 5)}")

from gradio_client import Client, handle_file

person_path = os.path.abspath("sample_images/user_clean_crop.jpg")
garment_path = os.path.abspath("sample_images/oxford_shirt_raw.jpg")

if not os.path.exists(person_path):
    print(f"[ERROR] Person image not found: {person_path}")
    sys.exit(1)
if not os.path.exists(garment_path):
    print(f"[ERROR] Garment image not found: {garment_path}")
    sys.exit(1)

print(f"[*] Person image: {person_path} ({os.path.getsize(person_path)} bytes)")
print(f"[*] Garment image: {garment_path} ({os.path.getsize(garment_path)} bytes)")

client = Client(space, token=token)

# Prepare ImageEditor dict
editor_dict = {
    "background": handle_file(person_path),
    "layers": [],
    "composite": None
}

print("[*] Submitting genuine try-on request to remote GPU...")
start_time = time.perf_counter()

try:
    result = client.predict(
        dict=editor_dict,
        garm_img=handle_file(garment_path),
        garment_des="Short Sleeve Oxford Dress Shirt",
        is_checked=True,         # Auto-generate mask
        is_checked_crop=False,     # No auto-crop
        denoise_steps=30,
        seed=42,
        api_name="/tryon"
    )
    duration = time.perf_counter() - start_time
    print(f"[+] INFERENCE SUCCESSFUL in {duration:.2f} seconds!")
    print(f"[*] Raw return value type: {type(result)}")
    print(f"[*] Raw result: {result}")

    out_img = result[0]
    mask_img = result[1] if len(result) > 1 else None

    os.makedirs("sample_images/outputs", exist_ok=True)
    saved_ai_path = os.path.abspath("sample_images/outputs/04_idm_vton_ai_result.png")
    shutil.copyfile(out_img, saved_ai_path)
    print(f"[+] Saved genuine IDM-VTON result to: {saved_ai_path}")
    print(f"[*] File size: {os.path.getsize(saved_ai_path)} bytes")

    if mask_img and os.path.exists(mask_img):
        saved_mask_path = os.path.abspath("sample_images/outputs/05_idm_vton_mask.png")
        shutil.copyfile(mask_img, saved_mask_path)
        print(f"[+] Saved IDM-VTON mask to: {saved_mask_path}")

except Exception as e:
    duration = time.perf_counter() - start_time
    print(f"[ERROR] Inference failed after {duration:.2f}s: {type(e).__name__}: {str(e)}")
    sys.exit(1)

