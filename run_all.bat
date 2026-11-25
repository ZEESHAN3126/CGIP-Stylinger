@echo off
:: Stylinger — Virtual Fashion Styling Complete System Launcher
:: Launches Classical CV Engine (port 5001), Flask Web API (port 5000), and React/Vite UI (port 5173) concurrently.

setlocal
cd /d "%~dp0"

echo ============================================================
echo   Stylinger Virtual Fashion Try-On Studio (Classical CG/IP)
echo ============================================================
echo.
echo [*] Launching all system services...
echo     - CV Engine:     http://127.0.0.1:5001
echo     - Flask Web API: http://127.0.0.1:5000
echo     - React Studio:  http://127.0.0.1:5173
echo.
echo Press Ctrl+C to terminate all services.
echo ============================================================

npm run dev
pause

