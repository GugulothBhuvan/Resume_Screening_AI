# KGP ScholarScreen AI

This repository contains a full-stack project with:

- `backend/` — FastAPI backend, Celery worker, PostgreSQL/Redis support
- `frontend/` — Next.js React frontend
- `docker-compose.yml` — local development / containerized deployment setup

## Quick start

1. Clone the repo and push to GitHub.
2. Configure backend secrets in `backend/.env` or the hosting platform.
3. Use Docker Compose for local testing:
   ```bash
   docker compose up --build
   ```

## Recommended hosting setup

### Backend

Use a service such as Render or Railway.

- Service type: Web Service
- Start command:
  ```bash
  uvicorn app.main:app --host 0.0.0.0 --port 8000
  ```
- Environment variables:
  - `GEMINI_API_KEY`
  - `DATABASE_URL` (Postgres)
  - `CELERY_BROKER_URL` (Redis)
  - `CELERY_RESULT_BACKEND` (Redis)
  - `CHROMA_DB_DIR`
  - `BACKEND_CORS_ORIGINS` (e.g. `*` for testing)

### Worker

Use a second service for Celery worker.

- Service type: Worker / Background Worker
- Start command:
  ```bash
  celery -A app.core.celery_app worker --loglevel=info
  ```
- Same environment variables as backend.

### Database & queue

Provision managed services:

- PostgreSQL for `DATABASE_URL`
- Redis for Celery broker/result backend

Example `DATABASE_URL` for deployment:

```env
DATABASE_URL="postgresql+psycopg2://kgp_user:kgp_password@<host>:5432/kgp_ai"
```

### Frontend

Use Vercel or Netlify to host `frontend/`.

- Framework: Next.js
- Build command: `npm run build`
- Start command: `npm start`
- Environment variable:
  - `NEXT_PUBLIC_API_URL` set to your deployed backend URL

## GitHub repo structure

- `backend/` — Python API and worker code
- `frontend/` — Next.js application
- `docker-compose.yml` — host backend, worker, Postgres, Redis, and frontend locally
- `.gitignore` — root-level ignore rules

## Notes

- Local development can still use SQLite, but hosted deployment should use PostgreSQL.
- Do not commit secrets or `.env` files to GitHub.
- After pushing to GitHub, connect the repo to Render or Railway for automatic deploys.
