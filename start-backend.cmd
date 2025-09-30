@echo off
REM Start FastAPI backend with uvicorn from the correct folder
cd /d %~dp0\backend
"%~dp0\.venv\Scripts\uvicorn.exe" app:app --host 127.0.0.1 --port 8000 --reload
