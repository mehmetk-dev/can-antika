# Local Development

This project has 2 local run modes. Do not mix them in the same session.

## Mode A - Full Docker (frontend + backend + db + redis)

Use this when you want everything inside Docker.

```bash
docker compose up -d --build
```

Endpoints:
- Frontend: `http://localhost:3005`
- Backend API: `http://localhost:8085`
- DB: `localhost:5440`
- Redis: `localhost:6379`

Required env source:
- Root `.env` (or exported shell env vars)

Notes:
- Frontend container talks to backend container via `http://backend:8080` internally.
- Browser talks to backend via `http://localhost:8085`.

## Mode B - Hybrid Local (backend in Docker, frontend on host)

Use this when you run Next.js with hot reload on your machine.

1) Start backend stack:
```bash
docker compose --env-file .env.local -f docker-compose.local.yml up -d --build
```

2) Start frontend on host:
```bash
cd can-antika-frontend
npm install
npm run dev
```

Endpoints:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8080`
- DB: `localhost:5440`
- Redis: `localhost:6379`

Required env source:
- Root `.env.local` for compose-local
- `can-antika-frontend/.env.local` for Next.js host mode

## Quick Checks

If frontend cannot reach backend:

1. Check backend health:
```bash
curl http://localhost:8080/actuator/health
```
or (Mode A):
```bash
curl http://localhost:8085/actuator/health
```

2. Check frontend env:
- `can-antika-frontend/.env.local` should contain:
  - `NEXT_PUBLIC_API_URL=http://localhost:8080` (Mode B)

3. Check compose mode:
- If you started `docker-compose.local.yml`, use Mode B ports.
- If you started `docker-compose.yml`, use Mode A ports.

## Common Commands

Logs:
```bash
docker compose -f docker-compose.local.yml logs -f backend
docker compose logs -f backend
```

Stop:
```bash
docker compose -f docker-compose.local.yml down
docker compose down
```

Reset volumes (danger: deletes local data):
```bash
docker compose -f docker-compose.local.yml down -v
docker compose down -v
```
