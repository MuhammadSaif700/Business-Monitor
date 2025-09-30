R"""HTTP smoke test for the running backend.

What it does:
- Reads BACKEND_PASSWORD from backend/.env
- Obtains an API token via /auth/token
- Uploads sample CSV from backend/tests/sample_transactions.csv
- Calls /reports/summary and /ai/query endpoints
- Prints a compact PASS/FAIL report

Run it while the server is running at 127.0.0.1:8000.

Usage (PowerShell):
  cd C:/Users/ab/Downloads/client/backend
  ..\.venv\Scripts\python.exe scripts/smoke_http.py
"""
from pathlib import Path
import os
import sys
import json
import requests
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[1]
ENV_PATH = BACKEND_DIR / ".env"
load_dotenv(dotenv_path=str(ENV_PATH))

BASE = os.getenv("SMOKE_BASE_URL", "http://127.0.0.1:8000")
PASSWORD = os.getenv("BACKEND_PASSWORD")

RED = "\x1b[31m"
GRN = "\x1b[32m"
YLW = "\x1b[33m"
RST = "\x1b[0m"

failures = []

print(f"Using base URL: {BASE}")

# 1) Auth token
headers = {"Content-Type": "application/json"}
token = None
try:
    if not PASSWORD:
        raise RuntimeError("BACKEND_PASSWORD missing in backend/.env")
    r = requests.post(f"{BASE}/auth/token", json={"password": PASSWORD}, timeout=10)
    r.raise_for_status()
    token = r.json().get("token")
    assert token, "No token returned"
    print(f"{GRN}Auth: PASS{RST}")
except Exception as e:
    print(f"{RED}Auth: FAIL - {e}{RST}")
    failures.append("auth")

# Prepare auth header
if token:
    headers = {**headers, "X-API-KEY": token}

# 2) Upload sample CSV
try:
    sample = BACKEND_DIR / "tests" / "sample_transactions.csv"
    assert sample.exists(), f"Sample file not found: {sample}"
    with open(sample, "rb") as f:
        files = {"file": ("sample.csv", f, "text/csv")}
        r = requests.post(f"{BASE}/upload", files=files, timeout=20)
    r.raise_for_status()
    js = r.json()
    assert js.get("status") == "ok", js
    rows = js.get("rows", 0)
    print(f"{GRN}Upload: PASS ({rows} rows){RST}")
except Exception as e:
    print(f"{RED}Upload: FAIL - {e}{RST}")
    failures.append("upload")

# 3) Summary
try:
    r = requests.get(f"{BASE}/reports/summary", headers=headers, timeout=10)
    r.raise_for_status()
    js = r.json()
    assert "total_sales" in js and "profit" in js
    print(f"{GRN}Summary: PASS (sales={js['total_sales']}, profit={js['profit']}){RST}")
except Exception as e:
    print(f"{RED}Summary: FAIL - {e}{RST}")
    failures.append("summary")

# 4) AI queries (will return a friendly message if AI is disabled)
try:
    r = requests.get(f"{BASE}/ai/query", params={"query": "sales_over_time"}, headers=headers, timeout=15)
    r.raise_for_status()
    js = r.json()
    assert "data" in js, js
    print(f"{GRN}AI sales_over_time: PASS{RST}")
except Exception as e:
    print(f"{YLW}AI sales_over_time: WARN - {e}{RST}")

try:
    r = requests.get(f"{BASE}/ai/query", params={"query": "most_profitable_product"}, headers=headers, timeout=15)
    r.raise_for_status()
    js = r.json()
    assert "data" in js, js
    print(f"{GRN}AI most_profitable_product: PASS{RST}")
except Exception as e:
    print(f"{YLW}AI most_profitable_product: WARN - {e}{RST}")

# Result
if failures:
    print(f"\n{RED}SMOKE: FAIL - {', '.join(failures)}{RST}")
    sys.exit(1)
else:
    print(f"\n{GRN}SMOKE: PASS{RST}")
