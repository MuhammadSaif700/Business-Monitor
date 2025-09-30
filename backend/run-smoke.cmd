@echo off
REM Run HTTP smoke test against a running backend
cd /d %~dp0
"%~dp0\..\.venv\Scripts\python.exe" scripts\smoke_http.py
