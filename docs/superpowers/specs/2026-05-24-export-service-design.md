# Export Service — Design Spec

Date: 2026-05-24

## Overview

A new `export-service` microservice (Python/FastAPI, port 8002) that generates a downloadable PDF report from a completed document's analysis results. Triggered by the user clicking "Export PDF" in the frontend. The Java API acts as proxy: fetches document from DB, calls export service, streams PDF bytes back to the browser.

## Architecture

New directory `export-service/` at repo root.

```
export-service/
├── app/
│   ├── main.py
│   ├── api/routes.py             # POST /export → PDF bytes, GET /health
│   ├── models/schemas.py         # ExportRequest pydantic model
│   └── services/pdf_builder.py   # builds PDF using fpdf2
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   └── test_routes.py
├── requirements.txt
├── Dockerfile
└── pytest.ini
```

## Components

### `ExportRequest` (Pydantic)
```json
{
  "fileName": "invoice.pdf",
  "status": "COMPLETED",
  "summary": "Invoice from ABC Corp",
  "extractedText": "Full text...",
  "structuredData": { "vendorName": "ABC Corp", "amount": 1500 }
}
```

### `pdf_builder.build_pdf(request: ExportRequest) -> bytes`
Uses `fpdf2`. PDF layout:
1. Title: document file name
2. Section: Summary
3. Section: Structured Data (key-value pairs from `structuredData`)
4. Section: Extracted Text (if present)

Returns raw PDF bytes.

### `POST /export`
- Validates status is `COMPLETED` — returns 422 if not
- Calls `pdf_builder.build_pdf()`
- Returns `Response(content=pdf_bytes, media_type="application/pdf")`

### `GET /health`
Returns `{"status": "ok"}`.

## Java API Changes

### `ExportClient`
- WebClient-based client targeting `${EXPORT_SERVICE_URL:http://localhost:8002}`
- `export(ExportRequest) -> byte[]` — blocking call (user is waiting for download)
- Timeout: 30 seconds

### New endpoint `GET /api/documents/{id}/export`
- Fetches document from DB via `DocumentRepository`
- Returns 404 if not found, 422 if status is not `COMPLETED`
- Builds `ExportRequest` from document entity
- Calls `exportClient.export(request)`
- Returns `ResponseEntity<byte[]>` with headers:
  - `Content-Type: application/pdf`
  - `Content-Disposition: attachment; filename="{fileName}.pdf"`

### New env var
- `EXPORT_SERVICE_URL` — defaults to `http://localhost:8002`

## Frontend Changes

### `DocumentDetail.tsx`
- Add "Export PDF" button, visible only when `document.status === 'COMPLETED'`
- Render an `<a href="/api/documents/{id}/export" download>` anchor styled as a button — browser handles the download natively, no JS needed

### `api.ts`
- No new function needed — the export URL is just `/api/documents/{id}/export`, constructed inline in the component

## Docker Compose

```yaml
export-service:
  build: ./export-service
  ports:
    - "8002:8002"
  healthcheck:
    test: ["CMD-SHELL", "curl -sf http://localhost:8002/health || exit 1"]
    interval: 10s
    timeout: 5s
    retries: 5
```

`java-api` adds `export-service` to `depends_on` with `condition: service_healthy`.

Pass `EXPORT_SERVICE_URL: http://export-service:8002` to `java-api` environment.

## Error Handling

| Scenario | Behaviour |
|---|---|
| Document not found | Java API returns 404 |
| Document status not COMPLETED | Java API returns 422 with message |
| Export service returns 422 | Java API returns 422 |
| Export service down / 500 | Java API returns 503 |
| PDF generation failure | Export service returns 500 |

## Testing

- `POST /export` with valid COMPLETED document data → 200, response is PDF bytes (`application/pdf`)
- `POST /export` with non-COMPLETED status → 422
- `GET /health` → 200
