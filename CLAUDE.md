# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

Three-service system wired together via Docker Compose:

```
React Frontend (port 3000)
       ↓ REST (proxied via Nginx in prod, Vite dev proxy to :8080)
Spring Boot API (port 8080)  ←→  PostgreSQL (port 5432)
       ↓ REST (internal)
Python AI Service (port 8000)
```

**Key constraint:** The frontend communicates only with the Java API. The Java API calls the Python service internally. The Python service is not exposed publicly.

**Upload flow:** File arrives at Java API → saved as PENDING → status set to PROCESSING → base64-encoded file sent to Python `/analyze` → result stored → status set to COMPLETED or FAILED.

**Document status lifecycle:** `PENDING → PROCESSING → COMPLETED | FAILED`

## Services

### Java API (`java-api/`)
Spring Boot 3.3 / Java 21 / Gradle. Uses Spring Data JPA (PostgreSQL in prod, H2 in tests), Spring WebFlux `WebClient` for calling the Python service, Lombok, and MapStruct.

- `controller/` → `service/` → `repository/` → `entity/`
- `client/PythonAiClient` — WebFlux-based HTTP client to Python service
- `dto/` — `AnalyzeRequest`, `AnalyzeResponse`, `DocumentResponse`
- `mapper/DocumentMapper` — MapStruct mapper from entity to response DTO
- Tests use H2 in PostgreSQL-compat mode (`src/test/resources/application.yml`)
- `extractedJson` column stores the Python service's `structuredData` as a JSON string; the frontend parses it with `JSON.parse()`

### Python AI Service (`python-ai/`)
FastAPI / uvicorn. Single meaningful layer: `app/services/analyzer.py` calls Gemini 2.5 Flash with the file bytes (decoded from base64) and a strict JSON-only prompt.

- `app/api/routes.py` — `POST /analyze`, `GET /health`
- `app/models/schemas.py` — Pydantic request/response models
- `app/services/analyzer.py` — Gemini API call + JSON parsing with markdown-fence stripping
- Tests in `tests/` (pytest), run from `python-ai/` directory

### Frontend (`frontend/`)
React 19 / TypeScript / Vite / Tailwind CSS 4. No router — single-page with sidebar + detail pane layout.

- `src/api/api.ts` — Axios wrapper for all three Java API endpoints
- `src/types/document.ts` — `DocumentResponse` interface (single source of truth for status values)
- `src/components/Sidebar.tsx` — document list + drag-and-drop upload zone
- `src/components/DocumentDetail.tsx` — tabbed detail view (Summary, Extracted Text, Structured Data)
- `src/App.tsx` — state owner: document list, selected document, loading/error state
- Dev server proxies `/api/*` to `http://localhost:8080`

## Commands

### Start everything
```bash
cp .env.example .env          # fill in GEMINI_API_KEY
docker compose up --build
```

### Java API
```bash
cd java-api
./gradlew bootRun             # run locally (needs Postgres + Python service running)
./gradlew test                # all tests
./gradlew test --tests "com.example.documentanalyzer.service.DocumentServiceTest"  # single test class
```

### Python AI Service
```bash
cd python-ai
python -m pytest              # all tests
python -m pytest tests/test_routes.py::test_health  # single test
uvicorn app.main:app --reload  # run locally (needs GEMINI_API_KEY env var)
```

### Frontend
```bash
cd frontend
npm install
npm run dev                   # dev server at http://localhost:5173
npm test                      # vitest (single run)
npm run test:watch            # vitest watch mode
npm run lint                  # eslint
npm run build                 # production build
```

## Environment Variables

Copy `.env.example` to `.env` before running Docker Compose:

| Variable | Purpose |
|---|---|
| `POSTGRES_DB` | Database name (default: `documentdb`) |
| `POSTGRES_USER` | DB user (default: `postgres`) |
| `POSTGRES_PASSWORD` | DB password |
| `GEMINI_API_KEY` | Google Gemini API key (required for AI analysis) |

The Java API also accepts `DB_URL`, `DB_USER`, `DB_PASSWORD`, and `PYTHON_AI_URL` — all defaulted in `application.yml` for local dev without Docker.

## Key Design Decisions

- **Synchronous AI processing:** The upload endpoint blocks until the Python service responds (60 s timeout). Documents move through `PENDING → PROCESSING → COMPLETED/FAILED` within a single HTTP request.
- **Base64 transport:** Files are base64-encoded in Java and sent as JSON to the Python service (no shared filesystem needed between containers).
- **`extractedJson` as string:** Java stores `structuredData` as a serialized JSON string. The frontend must `JSON.parse()` it before rendering.
- **H2 for Java tests:** Test profile (`src/test/resources/application.yml`) uses H2 in PostgreSQL-compat mode so no Docker is needed for unit/integration tests.
