# Backend (Express API)

This folder contains a simple Express backend used by the Health Queue frontend.

## Setup

```bash
cd Backend
npm install
```

## Run

```bash
npm run dev
```

The backend will start on `http://localhost:5000`.

Swagger documentation is available at `http://localhost:5000/api-docs`.
The raw OpenAPI JSON is available at `http://localhost:5000/api-docs.json`.

## Endpoints

- `GET /health` - health check
- `GET /api-docs` - Swagger UI documentation
- `GET /api-docs.json` - OpenAPI JSON document
- `GET /api/appointments?userId=<id>` - sample appointment data (filters by `userId` when provided)
