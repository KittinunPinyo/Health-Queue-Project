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

## Endpoints

- `GET /health` - health check
- `GET /api/appointments?userId=<id>` - sample appointment data (filters by `userId` when provided)
