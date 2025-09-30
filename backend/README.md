Backend (FastAPI)

Quick start

1. Create a virtual environment and install deps:

   python -m venv .venv; .\.venv\Scripts\Activate.ps1; pip install -r requirements.txt

2. Run the dev server:

   uvicorn app:app --reload --host 0.0.0.0 --port 8000

Endpoints:
- POST /upload -> accepts CSV or Excel with columns: date,type,product,quantity,price,customer,region
- GET /reports/summary
- GET /reports/by_product
- GET /reports/inventory
- GET /transactions
- GET /ai/insight

Auth (demo):
- You can enable a simple demo auth by setting `BACKEND_PASSWORD` and `BACKEND_API_KEY` in `.env`.
   - `BACKEND_PASSWORD` is used to exchange for the API key via `POST /auth/token`.
   - The frontend Login component posts the password to `/auth/token` and stores the returned token in `localStorage` as `api_token`.
   - When `BACKEND_API_KEY` is present, AI endpoints require `X-API-KEY` header (or the token returned from `/auth/token`).

Security note: This is a demo auth flow only. Use a proper auth provider in production.

Notes: This is a minimal starter. Add migrations, validation, and auth for production.

Migrations (Alembic):

1. Activate venv:  .\.venv\Scripts\Activate.ps1
2. Create a migration after changing models:  alembic revision -m "your message"
3. Apply migrations:  alembic upgrade head
4. Optional downgrade:  alembic downgrade -1

Initial migration is at `alembic/versions/0001_initial.py`.
