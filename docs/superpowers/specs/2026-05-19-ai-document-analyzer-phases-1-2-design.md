# AI Document Analyzer — Phases 1 & 2 Design

**Date:** 2026-05-19
**Scope:** Java Spring Boot backend (Phase 1) + Python FastAPI AI service (Phase 2)
**Out of scope:** React frontend, AWS deployment, GitHub Actions CI/CD

---

## 1. Goals

Build a working, containerized, AI-powered document analysis backend that:
- Accepts document uploads (PDF, PNG, JPG, JPEG)
- Analyzes documents using Google Gemini
- Persists results to PostgreSQL
- Runs entirely via `docker compose up --build`
- Is testable with curl or Postman (no frontend required)

---

## 2. Architecture

### Services

| Service | Technology | Port |
|---|---|---|
| `java-api` | Spring Boot 3.x / Java 21 / Gradle | 8080 |
| `python-ai` | FastAPI / Python 3.12 / uvicorn | 8000 |
| `postgres` | PostgreSQL 17 | 5432 |

No frontend container in this phase.

### Communication

- Client → Java API: `localhost:8080`
- Java API → Python AI: `http://python-ai:8000` (Docker Compose network)
- Java API → PostgreSQL: `jdbc:postgresql://postgres:5432/documentdb`
- Python AI → Gemini: outbound HTTPS to Google APIs

### Design Principles

- Frontend communicates only with Java API (no direct AI calls)
- Python service handles AI processing only — no business logic, no DB access
- No shared filesystem between services — file bytes passed via HTTP

---

## 3. Upload Flow

```
Client (curl/Postman)
    → POST localhost:8080/api/documents (multipart/form-data, field: "file")
    → java-api: validate file type + size
    → java-api: persist Document record (status=PENDING)
    → java-api: encode file as base64
    → java-api: POST http://python-ai:8000/analyze
              body: { fileContent, fileName, fileType }
    → python-ai: decode base64 → call Gemini inline_data API
    → python-ai: parse Gemini response → return { summary, extractedText, structuredData }
    → java-api: update Document record (status=COMPLETED, persist results)
    → java-api: return DocumentResponse to client
```

**Processing is synchronous.** The upload request blocks until AI analysis completes. No polling required for MVP.

**Error handling:** If the Python call fails or times out, the Document record is updated to `status=FAILED` and the error message is stored. The Java API returns the failed document record — it does not crash with a 500.

**Status lifecycle:** `PENDING → PROCESSING → COMPLETED | FAILED`

---

## 4. Database Schema

```sql
CREATE TABLE documents (
    id           UUID PRIMARY KEY,
    file_name    VARCHAR(255) NOT NULL,
    file_type    VARCHAR(50),
    status       VARCHAR(50),
    summary      TEXT,
    extracted_text TEXT,
    extracted_json JSONB,
    created_at   TIMESTAMP NOT NULL
);
```

Schema managed by `spring.jpa.hibernate.ddl-auto=update` for MVP (no Flyway).

---

## 5. Java Backend

### Package Structure

```
com.example.documentanalyzer/
  controller/
    DocumentController.java      REST endpoints
  service/
    DocumentService.java         Orchestration logic
  repository/
    DocumentRepository.java      JPA repository
  entity/
    Document.java                JPA entity
  dto/
    DocumentResponse.java        Outbound API shape
    AnalyzeRequest.java          Sent to Python service
    AnalyzeResponse.java         Received from Python service
  client/
    PythonAiClient.java          WebClient wrapper
  config/
    WebClientConfig.java         WebClient bean
  exception/
    GlobalExceptionHandler.java  @ControllerAdvice error handler
```

### REST Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/documents` | Upload and analyze a document |
| GET | `/api/documents` | List all documents |
| GET | `/api/documents/{id}` | Get a single document by ID |

**Upload request:** `multipart/form-data`, field name `file`
**Allowed types:** `pdf`, `png`, `jpg`, `jpeg`
**Max file size:** 10MB (configured in `application.yml`)

### Key Configuration (`application.yml`)

```yaml
spring:
  datasource:
    url: ${DB_URL}
    username: ${DB_USER}
    password: ${DB_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: update
  servlet:
    multipart:
      max-file-size: 10MB
      max-request-size: 10MB

python-ai:
  base-url: ${PYTHON_AI_URL:http://python-ai:8000}
  timeout-seconds: 60
```

### WebClient

Non-blocking HTTP client with a 60-second response timeout. Configured via `WebClientConfig` and injected into `PythonAiClient`.

---

## 6. Python AI Service

### Package Structure

```
app/
  main.py              FastAPI app init, CORS, lifespan
  api/
    routes.py          POST /analyze, GET /health endpoints
  services/
    analyzer.py        Gemini call + response parsing
  models/
    schemas.py         Pydantic request/response models
requirements.txt
Dockerfile
```

### Endpoints

**POST /analyze**

Request:
```json
{
  "fileContent": "<base64-encoded bytes>",
  "fileName": "invoice.pdf",
  "fileType": "application/pdf"
}
```

Response:
```json
{
  "summary": "Invoice from ABC Corp totaling $1,500 dated 2026-05-01",
  "extractedText": "raw text extracted from document...",
  "structuredData": {
    "vendorName": "ABC Corp",
    "amount": 1500,
    "invoiceDate": "2026-05-01"
  }
}
```

**GET /health**

Response: `{"status": "ok"}`

### Gemini Integration

- Model: `gemini-2.0-flash`
- SDK: `google-generativeai`
- File passed as `inline_data` (base64 + mime type) — no separate OCR step
- Single prompt requests both summary and structured JSON extraction in one API call
- `GEMINI_API_KEY` injected via environment variable

**Prompt strategy:** Ask Gemini to return a JSON object with `summary`, `extractedText`, and `structuredData` fields. Parse the JSON from the response. If parsing fails, return the raw text as summary with empty structuredData.

---

## 7. Docker Setup

### docker-compose.yml

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:17
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - "5432:5432"

  python-ai:
    build: ./python-ai
    ports:
      - "8000:8000"
    environment:
      GEMINI_API_KEY: ${GEMINI_API_KEY}

  java-api:
    build: ./java-api
    ports:
      - "8080:8080"
    depends_on:
      - postgres
      - python-ai
    environment:
      DB_URL: jdbc:postgresql://postgres:5432/${POSTGRES_DB}
      DB_USER: ${POSTGRES_USER}
      DB_PASSWORD: ${POSTGRES_PASSWORD}
      PYTHON_AI_URL: http://python-ai:8000
```

### .env (gitignored)

```
POSTGRES_DB=documentdb
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
GEMINI_API_KEY=your-key-here
```

### Dockerfiles

**java-api/Dockerfile:** Multi-stage build — Gradle build stage produces fat JAR, slim `eclipse-temurin:21-jre` runtime image runs it.

**python-ai/Dockerfile:** `python:3.12-slim` base, installs `requirements.txt`, runs `uvicorn app.main:app --host 0.0.0.0 --port 8000`.

### Development Workflow

```bash
cp .env.example .env          # fill in GEMINI_API_KEY
docker compose up --build     # first run or after code changes
docker compose up             # reuse cached images
docker compose logs java-api  # tail a service
docker compose down           # stop all services
```

---

## 8. Project Structure

```
ai-document-analyzer/
├── java-api/
│   ├── src/main/java/com/example/documentanalyzer/
│   ├── src/main/resources/application.yml
│   ├── build.gradle
│   ├── settings.gradle
│   └── Dockerfile
├── python-ai/
│   ├── app/
│   ├── requirements.txt
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
├── .gitignore
├── PRD.md
└── docs/
    └── superpowers/
        └── specs/
```

---

## 9. Security

- File type validated against allowlist (`pdf`, `png`, `jpg`, `jpeg`)
- Max upload size enforced at 10MB
- `GEMINI_API_KEY` and DB credentials in environment variables only
- Python AI service not exposed publicly (internal Docker network); only Java API is client-facing
- No hardcoded credentials anywhere

---

## 10. Success Criteria

- `docker compose up --build` starts all three services without errors
- `POST /api/documents` with a PDF returns a JSON response with summary and structured data
- `GET /api/documents` lists all uploaded documents from PostgreSQL
- `GET /api/documents/{id}` returns full analysis for a specific document
- Failed AI calls result in `status=FAILED` record, not a server crash
- No credentials committed to git
