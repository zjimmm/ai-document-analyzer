# GitHub Actions CI/CD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a GitHub Actions pipeline that runs all tests in parallel on every push/PR, and builds + pushes Docker images to GitHub Container Registry on merges to `main`.

**Architecture:** One workflow file (`.github/workflows/ci.yml`) with four jobs: `test-frontend`, `test-java`, and `test-python` run in parallel on every trigger; `build-and-push` runs only on push to `main` after all three test jobs pass.

**Tech Stack:** GitHub Actions, GitHub Container Registry (ghcr.io), `GITHUB_TOKEN` (auto-provided by GitHub)

---

## File Map

| File | Purpose |
|------|---------|
| `.github/workflows/ci.yml` | The entire CI/CD pipeline |

---

## Task 1: Create the CI/CD workflow

**Files:**
- Create: `.github/workflows/ci.yml`

CI/CD workflows are YAML config — there is no TDD cycle. Validation is done by checking YAML syntax locally, then verified by pushing to GitHub and watching the Actions tab.

- [ ] **Step 1: Create the workflow directory**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: Create the workflow file**

Create `.github/workflows/ci.yml` with the following exact content:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      - name: Install dependencies
        run: npm ci
        working-directory: frontend
      - name: Run tests
        run: npm test
        working-directory: frontend

  test-java:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: 'gradle'
      - name: Run tests
        run: ./gradlew test
        working-directory: java-api

  test-python:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - name: Install dependencies
        run: pip install -r requirements.txt
        working-directory: python-ai
      - name: Run tests
        run: pytest
        working-directory: python-ai

  build-and-push:
    runs-on: ubuntu-latest
    needs: [test-frontend, test-java, test-python]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - name: Build and push frontend
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          push: true
          tags: ghcr.io/zjimmm/ai-document-analyzer-frontend:latest
      - name: Build and push java-api
        uses: docker/build-push-action@v5
        with:
          context: ./java-api
          push: true
          tags: ghcr.io/zjimmm/ai-document-analyzer-java-api:latest
      - name: Build and push python-ai
        uses: docker/build-push-action@v5
        with:
          context: ./python-ai
          push: true
          tags: ghcr.io/zjimmm/ai-document-analyzer-python-ai:latest
```

- [ ] **Step 3: Validate YAML syntax**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))" && echo "YAML valid"
```

Expected: `YAML valid`

- [ ] **Step 4: Commit and push**

```bash
git add .github/workflows/ci.yml
git commit -m "feat: add GitHub Actions CI/CD pipeline"
git push origin main
```

- [ ] **Step 5: Verify pipeline runs on GitHub**

1. Go to `https://github.com/zjimmm/ai-document-analyzer/actions`
2. You should see a workflow run triggered by the push
3. Verify `test-frontend`, `test-java`, `test-python` all show green ✅
4. Verify `build-and-push` runs after all tests pass and shows green ✅
5. Go to `https://github.com/zjimmm?tab=packages` to confirm the 3 Docker images appear

Expected: all 4 jobs green, 3 packages published.
