@echo off
REM Start FastAPI backend with uvicorn from the correct folder
cd /d %~dp0\backend
"%~dp0\.venv\Scripts\uvicorn.exe" app:app --host 0.0.0.0 --port 8000 --reload
