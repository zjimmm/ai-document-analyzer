# GitHub Actions CI/CD — Design Spec

## Goal

Add a GitHub Actions CI/CD pipeline that runs all tests on every push and PR, and builds + pushes Docker images to GitHub Container Registry on merges to `main`.

## Tech Stack

- GitHub Actions
- GitHub Container Registry (ghcr.io)
- `GITHUB_TOKEN` for authentication (no manual secrets needed)

---

## Triggers

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
```

Runs on: every push to `main` and every PR targeting `main`.

---

## Pipeline Structure

One workflow file: `.github/workflows/ci.yml`

Four jobs:

| Job | Trigger | Purpose |
|-----|---------|---------|
| `test-frontend` | all | `npm install && npm test` in `frontend/` |
| `test-java` | all | `./gradlew test` in `java-api/` |
| `test-python` | all | `pip install -r requirements.txt && pytest` in `python-ai/` |
| `build-and-push` | push to `main` only | Build all 3 Docker images, push to ghcr.io |

`test-frontend`, `test-java`, and `test-python` run in parallel. `build-and-push` has `needs: [test-frontend, test-java, test-python]` and only runs when all three pass and the trigger is a push to `main`.

---

## Job Details

### test-frontend

- Runner: `ubuntu-latest`
- Node version: 20
- Steps: checkout → setup-node → npm install → npm test
- Working directory: `frontend/`

### test-java

- Runner: `ubuntu-latest`
- Java version: 21 (Temurin distribution)
- Steps: checkout → setup-java → `./gradlew test`
- Working directory: `java-api/`
- No database needed — tests use H2 in-memory (PostgreSQL compatibility mode)

### test-python

- Runner: `ubuntu-latest`
- Python version: 3.12
- Steps: checkout → setup-python → `pip install -r requirements.txt` → `pytest`
- Working directory: `python-ai/`
- No API key needed — Gemini calls are mocked in tests

### build-and-push

- Runner: `ubuntu-latest`
- Condition: only on `push` to `main` (not on PRs)
- Steps:
  1. Checkout
  2. Log in to ghcr.io using `GITHUB_TOKEN`
  3. Build and push `frontend` image
  4. Build and push `java-api` image
  5. Build and push `python-ai` image

---

## Docker Image Names

| Service | Image |
|---------|-------|
| Frontend | `ghcr.io/zjimmm/ai-document-analyzer-frontend:latest` |
| Java API | `ghcr.io/zjimmm/ai-document-analyzer-java-api:latest` |
| Python AI | `ghcr.io/zjimmm/ai-document-analyzer-python-ai:latest` |

Images are tagged `latest` on every push to `main`. Authentication uses the `GITHUB_TOKEN` secret that GitHub provides automatically — no manual configuration required.

---

## File to Create

```
.github/
└── workflows/
    └── ci.yml
```

No other files need to be created or modified.
