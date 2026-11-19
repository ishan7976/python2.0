@echo off
setlocal enabledelayedexpansion

title PlacePath — Build Your Path. Achieve Your Goals.
cd /d "%~dp0"

echo ============================================================
echo   PlacePath - Student Career ^& Academic Command Center
echo   Build Your Path. Achieve Your Goals.
echo ============================================================
echo.

REM 1. Detect Python 3.10+
set "PYTHON_CMD="
where py >nul 2>&1
if %errorlevel%==0 (
    py -3 --version >nul 2>&1
    if !errorlevel!==0 set "PYTHON_CMD=py -3"
)

if "%PYTHON_CMD%"=="" (
    where python >nul 2>&1
    if %errorlevel%==0 (
        python --version >nul 2>&1
        if !errorlevel!==0 set "PYTHON_CMD=python"
    )
)

if "%PYTHON_CMD%"=="" (
    echo [ERROR] Python 3.10 or higher was not found on your system.
    echo Please install Python from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation.
    echo.
    pause
    exit /b 1
)

echo [OK] Found Python:
%PYTHON_CMD% --version

REM 2. Create virtual environment if missing
if not exist ".venv\Scripts\python.exe" (
    echo [INFO] Creating local virtual environment in .venv...
    %PYTHON_CMD% -m venv .venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
)

set "VENV_PYTHON=.venv\Scripts\python.exe"

REM 3. Install required dependencies if needed
"%VENV_PYTHON%" -c "import streamlit, plotly, pandas" >nul 2>&1
if errorlevel 1 (
    echo [INFO] Installing PlacePath dependencies from requirements.txt...
    "%VENV_PYTHON%" -m pip install --upgrade pip >nul 2>&1
    "%VENV_PYTHON%" -m pip install -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] Dependency installation failed. Check your internet connection and retry.
        pause
        exit /b 1
    )
) else (
    echo [OK] Dependencies already installed.
)

REM 4. Launch Streamlit application and open default browser
echo.
echo [INFO] Launching PlacePath in your default browser...
echo [INFO] Close this window or press Ctrl+C to stop PlacePath.
echo.
"%VENV_PYTHON%" -m streamlit run app.py --server.headless=false --browser.gatherUsageStats=false

if errorlevel 1 (
    echo.
    echo [ERROR] PlacePath exited unexpectedly.
    pause
    exit /b 1
)

endlocal
