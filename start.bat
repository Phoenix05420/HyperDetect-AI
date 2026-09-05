@echo off
title HyperDetect AI Launcher

echo ===================================================
echo Starting HyperDetect AI...
echo ===================================================

:: Start backend in a new command window
echo Starting FastAPI Backend...
start "HyperDetect Backend" cmd /k "cd backend && call venv\Scripts\activate && uvicorn app.main:app --reload"

:: Start frontend in a new command window
echo Starting Vite Frontend...
start "HyperDetect Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both services are starting up in new windows!
echo [Frontend URL] http://localhost:5173
echo [Backend URL]  http://localhost:8000
echo.
pause
