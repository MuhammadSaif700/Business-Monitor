"""
Utility script to wipe the transactions table in the local SQLite DB.

Usage (PowerShell):
  cd ..\backend
  ..\.venv\Scripts\activate
  ..\.venv\Scripts\python.exe scripts\reset_db.py

This will delete all rows from the transactions table in business.db (or business_test.db if PYTEST_CURRENT_TEST is set).
Stop the uvicorn server before running to avoid locking issues.
"""
import os
import sqlite3
from pathlib import Path

DB_DIR = Path(__file__).resolve().parent.parent
DB_NAME = "business.db"
if os.getenv("PYTEST_CURRENT_TEST"):
    DB_NAME = "business_test.db"
DB_PATH = DB_DIR / DB_NAME

if not DB_PATH.exists():
    print(f"DB file not found at {DB_PATH}. Nothing to reset.")
    raise SystemExit(0)

print(f"Resetting transactions in {DB_PATH} ...")
conn = sqlite3.connect(str(DB_PATH))
cur = conn.cursor()
cur.execute("DELETE FROM transactions")
conn.commit()
conn.close()
print("Done. All transactions cleared.")
