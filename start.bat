@echo off
echo ===================================================
echo   Starting Leads Generator Agent & Dashboard
echo ===================================================
echo.

echo [1/2] Starting Python FastAPI Backend (Port 8000)...
start "Leads Generator Backend" cmd /k ".\venv\Scripts\activate && python main.py serve"

echo [2/2] Starting Next.js Frontend (Port 3000)...
start "Leads Dashboard UI" cmd /k "cd web && npm run dev"

echo.
echo Both services are spinning up in separate windows!
echo Once they load, open http://localhost:3000 in your browser.
echo.
pause
