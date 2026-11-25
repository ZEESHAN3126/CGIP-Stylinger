"""Discovery script for IDM-VTON Hugging Face Space Gradio API schema.

Connects to the official Space configured in .env and prints the exact
API endpoints, parameters, ImageEditor structure, and return contracts.
NEVER prints or leaks the token.
"""

import os
import sys
from dotenv import load_dotenv

# Ensure we load local .env without printing secrets
load_dotenv()

space = os.environ.get("IDM_VTON_SPACE", "yisol/IDM-VTON")
token = os.environ.get("HF_TOKEN")

print(f"[*] Target Space: {space}")
print(f"[*] HF_TOKEN configured: {bool(token and len(token) > 5)}")

if not token:
    print("[!] Warning: HF_TOKEN not found in environment. Connecting anonymously (may hit strict rate limits).")

try:
    from gradio_client import Client
except ImportError:
    print("[ERROR] gradio_client is not yet installed in this environment.")
    sys.exit(1)

try:
    print(f"[*] Connecting to Hugging Face Space: {space} ...")
    # Pass token safely
    client = Client(space, token=token)
    print("[+] Successfully connected to Space!")
    print("\n" + "=" * 60)
    print("GRADIO API SCHEMA & ENDPOINTS:")
    print("=" * 60)
    client.view_api(all_endpoints=True)
    print("=" * 60)
except Exception as e:
    print(f"[ERROR] Failed to query Space API: {type(e).__name__}: {str(e)}")
    sys.exit(1)
