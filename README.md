# AI Business Monitor – FastAPI + React

This is a full-stack web app for uploading sales data (CSV/Excel), generating reports and charts, and getting AI-powered insights. Built with FastAPI (Python) and React (Vite + Tailwind + Chart.js).

## Quick start (Windows, PowerShell)

1) Backend – create venv, install deps, run server

```
cd backend
python -m venv ..\.venv
..\.venv\Scripts\pip install -r requirements.txt
..\.venv\Scripts\uvicorn.exe app:app --host 127.0.0.1 --port 8000 --reload
```

2) Frontend – install deps, run dev server

```
cd ../frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser. API docs are at http://127.0.0.1:8000/docs

## Demo auth

- Set backend password and API key in `backend/.env` (copy from `.env.example`).
- Login with that password to receive an API key used for AI endpoints.

## CSV Template

Download a template from the app or GET `http://127.0.0.1:8000/template/csv`.

Columns: date, product, price, quantity, region, customer, cost (optional)

## AI

- Toggle via `AI_ENABLED=true|false` in backend `.env`.
- Supports OpenAI or Hugging Face if keys are provided; otherwise returns helpful deterministic summaries.

## Scripts

- `start-backend.cmd` – run backend with reload.
- `backend/run-smoke.cmd` – quick smoke test against running backend.

## Notes

- CORS is configured for `http://localhost:5173` and `http://127.0.0.1:5173`.
- Exports available as CSV for summary, by_product, by_region, by_customer, transactions.

## New Professional Features

- Readiness endpoint: GET /readyz (checks DB)
- Metrics (Prometheus): GET /metrics (install requirements first)
- Rate limiting (env-configurable): RATE_LIMIT_UPLOAD_PER_MIN, RATE_LIMIT_AI_PER_MIN
- Upload error CSV export: GET /export/upload_errors.csv (last upload invalid rows)
- Transactions API: search, sorting (sort_by, sort_dir), filters (product, region, customer)
- Distincts API: GET /meta/distincts to power filter dropdowns
 - Transactions totals: API returns totals.page_amount and totals.global_amount; UI shows both
 - Export improvements: Export all filtered or only current page (respects filters/sort/limit/offset)

## Alembic (DB migrations)

Migrations are scaffolded. Typical workflow (PowerShell):

```
cd backend
..\.venv\Scripts\activate
# Create new migration after editing models
alembic revision -m "add new columns"
# Apply migrations
alembic upgrade head
# Downgrade if needed
alembic downgrade -1
```

The project includes initial migration in `backend/alembic/versions/0001_initial.py`.

## Docker (Production-like)

Build and run with Docker Compose:

```
docker compose build
docker compose up -d
```

Services:
- Backend: http://localhost:8000 (FastAPI)
- Frontend: http://localhost:5173 (nginx serving built app)

Set `VITE_API_BASE_URL` accordingly if deploying behind different hosts.
Business Monitor (fullstack prototype)

Structure:
- backend: FastAPI app (Python) - handles uploads, stores to SQLite, runs reports, AI integration placeholder
- frontend: React + Vite + Tailwind - upload UI, dashboard, transactions list, AI chat UI

Quick start (Windows PowerShell):

Backend:
1. cd backend
2. python -m venv .venv; .\.venv\Scripts\Activate.ps1; pip install -r requirements.txt
3. uvicorn app:app --reload --port 8000

Frontend:
1. cd frontend
2. npm install
3. npm run dev

Notes:
- Add your OpenAI API key to backend/.env as OPENAI_API_KEY=...
- This is a scaffold for development. Add validation, auth, migrations, and production hardening before deploying.
