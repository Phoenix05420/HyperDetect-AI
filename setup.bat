@echo off
title HyperDetect AI Setup

echo ===================================================
echo Setting up HyperDetect AI Project...
echo ===================================================

echo.
echo [1/2] Setting up Backend...
cd backend
echo Creating Python virtual environment...
python -m venv venv
call venv\Scripts\activate.bat
echo Installing Python dependencies...
pip install -r requirements.txt
cd ..

echo.
echo [2/2] Setting up Frontend...
cd frontend
echo Installing Node.js dependencies...
call npm install
cd ..

echo.
echo ===================================================
echo Setup complete! You can now run start.bat
echo ===================================================
pause
