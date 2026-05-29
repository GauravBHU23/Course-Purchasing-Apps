# CoursePurchaseApp

Production-style course purchase app scaffold:

- FastAPI backend with PostgreSQL
- JWT access token in httpOnly cookie
- Refresh token in scoped httpOnly cookie
- Refresh token hashing and rotation
- Email verification on sign-up
- Next.js TypeScript frontend
- Docker Compose deployment for local/server testing

## Local Run

### Without Docker

Install these first:

- Python 3.12+
- Node.js 22+
- PostgreSQL 16/17 running locally

Create the database/user that matches `backend/.env.example`, or update `backend/.env`.

Start both apps together:

```bash
./scripts/run-dev.sh
```

Or start separately in two terminals:

```bash
./scripts/run-backend.sh
```

```bash
./scripts/run-frontend.sh
```

Frontend: http://localhost:3000

Backend: http://localhost:8000

### With Docker

1. Backend env:

```bash
cd backend
cp .env.example .env
```

Use a long random `JWT_SECRET` before real deployment.

To enable real emails, also set SMTP values in `backend/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=CourseStack
SMTP_USE_TLS=true
```

If you use Gmail, create an App Password and use that instead of your normal Gmail password.

2. Start full stack:

```bash
cd ..
docker compose up --build
```

3. Open:

- Frontend: http://localhost:3000
- Backend docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

## Manual Backend Run

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
python -m app.db.seed
uvicorn app.main:app --reload
```

## Manual Frontend Run

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

## Production Security Checklist

- Set `JWT_SECRET` to a strong random secret and never commit it.
- Set `COOKIE_SECURE=true` behind HTTPS.
- Set `COOKIE_DOMAIN` to your real domain when frontend/backend share parent domain.
- Keep `CORS_ORIGINS` strict, for example `https://your-app.com`.
- Add a real payment provider webhook before marking purchases as paid.
- Add rate limiting at API gateway or reverse proxy.
- Run database backups and enable monitoring/log alerts.
