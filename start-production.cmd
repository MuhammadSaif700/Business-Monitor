@echo off
echo ================================================
echo  Business Monitor - Production Startup
echo ================================================
echo.

REM Check if .env exists
if not exist "backend\.env" (
    echo ERROR: backend\.env file not found!
    echo Please copy .env.example to .env and configure it.
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist ".venv\Scripts\activate.bat" (
    echo Creating virtual environment...
    python -m venv .venv
    call .venv\Scripts\activate.bat
    echo Installing backend dependencies...
    cd backend
    pip install -r requirements.txt
    cd ..
)

echo Starting Backend Server...
start "Business Monitor Backend" cmd /k "cd backend && ..\\.venv\\Scripts\\uvicorn.exe app:app --host 127.0.0.1 --port 8000"

timeout /t 3

echo Starting Frontend...
start "Business Monitor Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ================================================
echo  Business Monitor is starting...
echo  Backend:  http://127.0.0.1:8000
echo  Frontend: http://localhost:5173
echo ================================================
echo.
echo Press any key to exit (servers will keep running)
pause
