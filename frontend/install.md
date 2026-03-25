# Install

## Frontend

Use the project root:

```powershell
cd C:\Users\support.rv\Downloads\Scrapper\apexverse
npm ci
npm run dev
```

## Backend (`backend_simple`)

The backend must use `backend_simple/.venv`, which is currently on Python `3.13.7`.
Do not run the global `uvicorn` from Python `3.14`.

### Start from the repo root

```powershell
cd C:\Users\support.rv\Downloads\Scrapper\apexverse
backend_simple\.venv\Scripts\python.exe -m uvicorn backend_simple.main:app --reload --host 0.0.0.0 --port 8050
```

### Start from inside `backend_simple`

```powershell
cd C:\Users\support.rv\Downloads\Scrapper\apexverse\backend_simple
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8050
```

### Start with the helper script

```powershell
cd C:\Users\support.rv\Downloads\Scrapper\apexverse\backend_simple
.\start.ps1
```

### Validation

```powershell
cd C:\Users\support.rv\Downloads\Scrapper\apexverse\backend_simple
.\.venv\Scripts\python.exe --version
Invoke-RestMethod http://127.0.0.1:8050/health
```

Expected:

```json
{"ok":true,"service":"backend_simple"}
```

## Frontend-to-backend connection

The frontend now uses a same-origin Next.js API proxy instead of calling FastAPI directly from the browser.
If `backend_simple` is not running on `http://127.0.0.1:8050`, set this in the Next.js environment:

```powershell
BACKEND_SIMPLE_API_BASE_URL=https://your-fastapi-host
```

For local development, prefer `.env.local` in the project root. The local proxy also accepts `env.local` if that file already exists:

```env
BACKEND_SIMPLE_API_BASE_URL=http://127.0.0.1:8050
```
