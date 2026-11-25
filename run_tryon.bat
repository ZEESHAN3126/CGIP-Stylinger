@echo off
:: Stylinger — Virtual Try-On Service Launcher
:: Runs the classical CG/IP backend on port 5001.
:: Run this FIRST, then run run_studio.bat in a separate window.

setlocal

set "TRYON_DIR=%~dp0stylinger-cgip-main\stylinger-cgip-main\tryon-service"
set "VENV_DIR=%~dp0stylinger-cgip-main\stylinger-cgip-main\tryon-venv"

echo ============================================================
echo  Stylinger — Virtual Try-On Service (port 5001)
echo ============================================================
echo.

:: Check the tryon-service directory exists
if not exist "%TRYON_DIR%\app.py" (
    echo [ERROR] tryon-service not found at:
    echo   %TRYON_DIR%
    echo.
    echo Make sure the teammate project is extracted at:
    echo   stylinger-cgip-main\stylinger-cgip-main\tryon-service\
    pause
    exit /b 1
)

:: Prefer the dedicated tryon venv; fall back to the workspace venv
if exist "%VENV_DIR%\Scripts\python.exe" (
    set "PYTHON=%VENV_DIR%\Scripts\python.exe"
    echo [OK] Using tryon venv: %VENV_DIR%
) else if exist "%~dp0venv\Scripts\python.exe" (
    set "PYTHON=%~dp0venv\Scripts\python.exe"
    echo [OK] Using workspace venv: %~dp0venv
) else (
    set "PYTHON=python"
    echo [WARN] No venv found — using system Python
)
echo.

:: Install tryon-service deps if needed
echo [*] Installing / verifying tryon-service dependencies...
"%PYTHON%" -m pip install -q -r "%TRYON_DIR%\requirements.txt"
echo.

echo [*] Starting Virtual Try-On Service on http://127.0.0.1:5001 ...
echo     Press Ctrl+C to stop.
echo.

set "TRYON_PORT=5001"
cd /d "%TRYON_DIR%"
"%PYTHON%" app.py

pause
