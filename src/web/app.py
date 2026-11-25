"""Flask Application Factory for Stylinger Web Studio.

Constructs and configures the Flask application instance according to the
Application Factory pattern, registering routing blueprints and error handlers.
"""

import os
import sys
from typing import Optional, Dict, Any

# Ensure project root is in sys.path when launched directly
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from flask import Flask, render_template, jsonify, request


def create_app(test_config: Optional[Dict[str, Any]] = None) -> Flask:
    """Creates, configures, and returns a new Flask application instance.

    Args:
        test_config: Optional configuration dictionary for unit testing.

    Returns:
        Flask: The configured application factory instance.
    """
    base_dir = os.path.abspath(os.path.dirname(__file__))

    app = Flask(
        __name__,
        template_folder=os.path.join(base_dir, "templates"),
        static_folder=os.path.join(base_dir, "static"),
        static_url_path="/static"
    )

    # Core application configuration
    app.config.from_mapping(
        SECRET_KEY=os.environ.get("FLASK_SECRET_KEY", "stylinger-dev-key-classical-cgip"),
        MAX_CONTENT_LENGTH=10 * 1024 * 1024,  # 10 MB payload ceiling
        SESSION_ROOT=os.path.abspath(os.path.join(base_dir, "..", "..", "temp", "sessions")),
        STUDIO_NAME="Stylinger",
        STUDIO_TAGLINE="Classical CG/IP Virtual Fashion Styling",
        ACADEMIC_SCOPE="Digital Image Processing & 2D Transformation Pipeline"
    )

    if test_config:
        app.config.update(test_config)

    # Register modular blueprints
    from src.web.routes import main_bp, api_bp
    app.register_blueprint(main_bp)
    app.register_blueprint(api_bp, url_prefix="/api")

    # Global HTTP error handlers
    @app.errorhandler(404)
    def handle_not_found(err):
        if request.path.startswith("/api/"):
            return jsonify({
                "success": False,
                "error": {
                    "code": "RESOURCE_NOT_FOUND",
                    "message": "The requested API resource does not exist.",
                    "status_code": 404
                }
            }), 404
        return render_template("index.html", error_message="Page not found (404). Return to studio workspace.", pipeline_stages=[], catalog_preview=[], current_phase="Error 404"), 404

    @app.errorhandler(500)
    def handle_internal_server_error(err):
        if request.path.startswith("/api/"):
            return jsonify({
                "success": False,
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected server error occurred.",
                    "status_code": 500
                }
            }), 500
        return render_template("index.html", error_message="Internal studio server error (500). Please retry.", pipeline_stages=[], catalog_preview=[], current_phase="Error 500"), 500

    return app


if __name__ == "__main__":
    app_instance = create_app()
    app_instance.run(host="127.0.0.1", port=5000, debug=True)
