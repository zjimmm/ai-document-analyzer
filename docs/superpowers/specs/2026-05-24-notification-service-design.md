# Notification Service — Design Spec

Date: 2026-05-24

## Overview

A new `notification-service` microservice (Python/FastAPI, port 8001) that receives a notification event from the Java API after document analysis completes. Currently logs to console; designed with a pluggable notifier pattern so email/Slack/webhook can be added as a one-file swap later.

## Architecture

New directory `notification-service/` at repo root, following the same structure as `python-ai/`.

```
notification-service/
├── app/
│   ├── main.py
│   ├── api/routes.py           # POST /notify, GET /health
│   ├── models/schemas.py       # NotifyRequest pydantic model
│   └── notifiers/
│       ├── base.py             # BaseNotifier abstract class
│       └── console.py          # ConsoleNotifier implementation
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   └── test_routes.py
├── requirements.txt
├── Dockerfile
└── pytest.ini
```

## Components

### `BaseNotifier` (abstract)
```python
class BaseNotifier(ABC):
    @abstractmethod
    def send(self, request: NotifyRequest) -> None: ...
```

### `ConsoleNotifier`
Logs: `[NOTIFY] {fileName} → {status}: {summary}`

### `POST /notify`
Accepts `NotifyRequest`, instantiates `ConsoleNotifier`, calls `send()`. Always returns 200 — failures are logged but not propagated.

### `GET /health`
Returns `{"status": "ok"}`.

## Data Contract

**NotifyRequest:**
```json
{
  "documentId": "uuid-string",
  "fileName": "invoice.pdf",
  "status": "COMPLETED",
  "summary": "Invoice from ABC Corp for $1500"
}
```

`status` is one of: `COMPLETED`, `FAILED`.

## Java API Changes

### `NotificationClient`
- WebClient-based client targeting `${NOTIFICATION_SERVICE_URL:http://localhost:8001}`
- `notify(NotifyRequest)` — fires POST and calls `.subscribe()` (non-blocking, no return value)
- Timeout: 5 seconds (failure is silent)

### `DocumentService`
- After saving final document state (COMPLETED or FAILED), call `notificationClient.notify(...)` 
- Wrapped in try/catch — notification failure must never affect the upload response

### New env var
- `NOTIFICATION_SERVICE_URL` — defaults to `http://localhost:8001`

## Docker Compose

```yaml
notification-service:
  build: ./notification-service
  ports:
    - "8001:8001"
  healthcheck:
    test: ["CMD-SHELL", "curl -sf http://localhost:8001/health || exit 1"]
    interval: 10s
    timeout: 5s
    retries: 5
```

`java-api` does NOT add `notification-service` to `depends_on` — it calls it opportunistically.

Pass `NOTIFICATION_SERVICE_URL: http://notification-service:8001` to `java-api` environment.

## Error Handling

| Scenario | Behaviour |
|---|---|
| Notification service down | Java API logs warning, upload succeeds |
| `/notify` returns non-200 | Java API logs warning, upload succeeds |
| Timeout | Java API logs warning, upload succeeds |

## Testing

- `GET /health` → 200
- `POST /notify` with valid payload → 200, console output logged
- `POST /notify` with missing fields → 422 (FastAPI validation)

## Future Extension

To add email notifications: create `EmailNotifier(BaseNotifier)` and swap it into the route handler. No other changes needed.
