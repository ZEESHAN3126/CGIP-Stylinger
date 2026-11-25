@echo off
:: Stylinger — Web Studio Launcher
:: Runs the academic Flask web studio on port 5000.
:: Run run_tryon.bat first in a separate terminal window.

setlocal

set "ROOT=%~dp0"

echo ============================================================
echo  Stylinger — Web Studio (port 5000)
echo ============================================================
echo.
echo  PREREQUISITE: The Virtual Try-On service must be running
echo  on port 5001.  Start it with: run_tryon.bat
echo.

:: Prefer workspace venv
if exist "%ROOT%venv\Scripts\python.exe" (
    set "PYTHON=%ROOT%venv\Scripts\python.exe"
    echo [OK] Using workspace venv: %ROOT%venv
) else (
    set "PYTHON=python"
    echo [WARN] No venv found — using system Python. Run:
    echo         python -m venv venv
    echo         venv\Scripts\activate
    echo         pip install -r requirements.txt
)
echo.

:: Install / verify studio deps
echo [*] Installing / verifying web studio dependencies...
"%PYTHON%" -m pip install -q -r "%ROOT%requirements.txt"
echo.

echo [*] Starting Stylinger Web Studio on http://127.0.0.1:5000 ...
echo     Press Ctrl+C to stop.
echo.

set "FLASK_APP=src.web.app:create_app()"
set "FLASK_ENV=development"
set "FLASK_DEBUG=1"
set "TRYON_SERVICE_URL=http://127.0.0.1:5001"

cd /d "%ROOT%"
"%PYTHON%" -m flask --app src.web.app:create_app run --host=127.0.0.1 --port=5000 --debug

pause
