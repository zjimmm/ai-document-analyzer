# PRD — AI Document Analyzer

# 1. Project Overview

## Project Name

AI Document Analyzer

---

## Summary

AI Document Analyzer is a lightweight AI-powered document processing platform built using a microservice-style architecture.

The application allows users to upload documents such as invoices, receipts, and PDFs. A Java Spring Boot backend orchestrates the workflow while dedicated Python services handle AI processing, notifications, and PDF export.

The project is intended as a portfolio-grade engineering project to demonstrate:

- Java Spring Boot backend development
- Python AI integration
- Service-oriented architecture
- REST API communication
- Docker containerization
- Cloud deployment readiness
- React frontend integration
- CI/CD fundamentals
- AI-powered backend systems
- Event-driven notification patterns
- PDF report generation

---

# 2. Goals

## Primary Goals

- Demonstrate modern backend architecture
- Demonstrate AI integration into enterprise-style systems
- Demonstrate service separation between Java and Python
- Demonstrate Dockerized development
- Demonstrate cloud deployment readiness
- Build a realistic but manageable solo-developer project

---

## Secondary Goals

- Learn microservice-style communication
- Learn multi-service Docker Compose setup
- Build portfolio-ready GitHub repository
- Prepare for Cloud/API Integration roles
- Prepare for AI-enabled backend engineering interviews

---

# 3. Non-Goals

The MVP version will NOT include:

- Kubernetes
- Kafka
- Terraform
- Multi-cloud deployment
- Advanced authentication
- RBAC
- Vector databases
- RAG pipelines
- Real-time collaboration
- Multi-tenant SaaS support
- Billing/subscriptions
- Enterprise-scale distributed architecture

These may be added in future versions.

---

# 4. High-Level Architecture

```text
React Frontend
       |
       v
Spring Boot API ──────────────────────────────┐
       |                                       |
       ├──> Python AI Service (port 8000)      |
       |                                       |
       ├──> Notification Service (port 8001)   |
       |    (fire-and-forget, async)            |
       |                                       |
       ├──> Export Service (port 8002)         |
       |    (synchronous PDF generation)       |
       |                                       |
       v                                       |
PostgreSQL  <──────────────────────────────────┘
```

---

# 5. Architecture Philosophy

The system follows a lightweight microservice-style architecture.

## Design Principles

### Separation of Concerns

- Java API handles orchestration and business logic
- Python AI service handles AI processing only
- Notification service handles event notifications only
- Export service handles PDF generation only
- Frontend handles UI only

---

### Independent Services

Each service is a separate application:

- separate runtimes
- separate Docker containers
- separate codebases
- separate responsibilities

---

### Backend-Driven Architecture

Frontend communicates ONLY with the Java backend.

The frontend must never directly call AI providers or internal AI services.

---

# 6. Core Features

# MVP Features

## 6.1 Document Upload

Users can upload:

- PDF
- PNG
- JPG
- JPEG

---

## 6.2 Document Analysis

The system performs:

- OCR extraction
- AI summarization
- Basic field extraction

Example extracted fields:

```json
{
  "vendorName": "ABC Corp",
  "amount": 1500,
  "invoiceDate": "2026-05-01"
}
```

---

## 6.3 Document Dashboard

Users can:

- View uploaded documents
- View processing status
- View extracted summaries
- View extracted structured data

---

## 6.4 REST APIs

The backend exposes REST APIs for:

- Uploading documents
- Fetching documents
- Fetching analysis results

---

## 6.5 Containerized Development

All services run through Docker Compose.

---

## 6.6 Document Notifications

After a document is analyzed, the Java API fires a notification event to the Notification Service.

- Notification is fire-and-forget (non-blocking)
- Notification Service uses a pluggable `BaseNotifier` pattern
- Default implementation: `ConsoleNotifier` (logs to stdout)
- Designed to be extended with email, Slack, or webhook notifiers

---

## 6.7 PDF Export

Users can export a completed document analysis as a PDF report.

- Available only for documents with `COMPLETED` status
- Triggered by clicking "Export PDF" in the Document Detail view
- Java API calls Export Service synchronously and streams the PDF back to the browser
- PDF includes document summary, extracted text, and structured data fields

---

# 7. Tech Stack

# Frontend

| Technology | Purpose |
|---|---|
| React | UI |
| TypeScript | Type safety |
| Vite | Frontend tooling |
| Axios | API calls |

---

# Java Backend

| Technology | Purpose |
|---|---|
| Java 21 | Main backend |
| Spring Boot | REST APIs |
| Spring Data JPA | Database access |
| PostgreSQL | Persistence |
| WebClient | Internal service communication |

---

# Python AI Service

| Technology | Purpose |
|---|---|
| Python | AI processing |
| FastAPI | AI service APIs |
| OCR Library | Text extraction |
| Gemini 2.5 Flash | AI summarization |

---

# Notification Service

| Technology | Purpose |
|---|---|
| Python | Notification processing |
| FastAPI | Service API |
| Pluggable notifiers | ConsoleNotifier (stdout), extensible to email/Slack |

---

# Export Service

| Technology | Purpose |
|---|---|
| Python | PDF generation |
| FastAPI | Service API |
| fpdf2 | PDF report building |

---

# Infrastructure

| Technology | Purpose |
|---|---|
| Docker | Containerization |
| Docker Compose | Local orchestration |
| GitHub Actions | CI/CD |
| AWS | Cloud deployment |

---

# 8. Project Structure

```text
ai-document-analyzer/
├── frontend/
├── java-api/
├── python-ai/
├── notification-service/
├── export-service/
├── docker-compose.yml
├── README.md
├── PRD.md
└── docs/
```

---

# 9. Detailed Structure

# Frontend

```text
frontend/
├── src/
│   ├── api/
│   ├── pages/
│   ├── components/
│   ├── hooks/
│   ├── types/
│   └── App.tsx
├── package.json
└── vite.config.ts
```

---

# Java API

```text
java-api/
├── src/main/java/com/example/documentanalyzer/
│   ├── controller/
│   ├── service/
│   ├── repository/
│   ├── entity/
│   ├── dto/
│   ├── client/
│   ├── config/
│   └── exception/
├── src/main/resources/
├── build.gradle
└── Dockerfile
```

---

# Python AI Service

```text
python-ai/
├── app/
│   ├── api/
│   ├── services/
│   ├── models/
│   ├── utils/
│   └── main.py
├── requirements.txt
└── Dockerfile
```

---

# Notification Service

```text
notification-service/
├── app/
│   ├── api/
│   ├── models/
│   ├── notifiers/
│   │   ├── base.py
│   │   └── console.py
│   └── main.py
├── tests/
├── requirements.txt
└── Dockerfile
```

---

# Export Service

```text
export-service/
├── app/
│   ├── api/
│   ├── models/
│   ├── services/
│   │   └── pdf_builder.py
│   └── main.py
├── tests/
├── requirements.txt
└── Dockerfile
```

---

# 10. Functional Flow

# Upload Flow

```text
1. User uploads document from frontend
2. Spring Boot API receives upload
3. Java API stores metadata (status: PENDING)
4. Java API sets status to PROCESSING
5. Java API calls Python AI service
6. Python AI analyzes document
7. AI result returned to Java API
8. Java API stores analysis result (status: COMPLETED or FAILED)
9. Java API fires notification to Notification Service (async, fire-and-forget)
10. Frontend displays analysis result
```

---

# Export Flow

```text
1. User clicks "Export PDF" on a COMPLETED document
2. Frontend calls GET /api/documents/{id}/export
3. Java API calls Export Service synchronously
4. Export Service builds PDF from document data
5. PDF bytes returned to Java API
6. Java API streams PDF to browser
```

---

# Notification Flow

```text
1. Java API completes document analysis
2. Java API sends POST /notify to Notification Service (non-blocking)
3. Notification Service routes event to registered notifier(s)
4. ConsoleNotifier logs event to stdout
   (extensible: email, Slack, webhook)
```

---

# 11. Backend Responsibilities

# Spring Boot API Responsibilities

The Java API owns:

- File uploads
- Request validation
- Database persistence
- Business logic
- API orchestration
- Internal AI service communication
- Notification dispatch (async)
- PDF export orchestration
- Frontend APIs

The Java API is considered the main backend application.

---

# Python AI Service Responsibilities

The Python AI service owns ONLY:

- OCR
- AI summarization
- Field extraction
- AI prompt handling

---

# Notification Service Responsibilities

The Notification Service owns ONLY:

- Receiving notification events from the Java API
- Routing events to the appropriate notifier
- Logging notifications to stdout (ConsoleNotifier)

---

# Export Service Responsibilities

The Export Service owns ONLY:

- Receiving document data from the Java API
- Building PDF reports from document summaries and extracted fields
- Returning raw PDF bytes

---

All Python services should NOT handle:

- Authentication
- Frontend logic
- Business workflows
- Database orchestration

---

# 12. Database Design

# documents table

```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    status VARCHAR(50),
    summary TEXT,
    extracted_text TEXT,
    extracted_json JSONB,
    created_at TIMESTAMP NOT NULL
);
```

---

# 13. REST APIs

# Upload Document

## Endpoint

```http
POST /api/documents
```

## Content Type

```text
multipart/form-data
```

## Form Data

```text
file
```

---

# Get Documents

```http
GET /api/documents
```

---

# Get Document Detail

```http
GET /api/documents/{id}
```

---

# Export Document as PDF

```http
GET /api/documents/{id}/export
```

Response: `application/pdf` binary stream (only available for `COMPLETED` documents)

---

# 14. Internal Service APIs

# AI Service — Analyze Document

## Endpoint

```http
POST /analyze
```

## Request

```json
{
  "fileName": "invoice.pdf",
  "fileBase64": "<base64-encoded file bytes>"
}
```

## Response

```json
{
  "summary": "Invoice from ABC Corp",
  "extractedText": "...",
  "structuredData": {
    "vendorName": "ABC Corp",
    "amount": 1500
  }
}
```

---

# Notification Service — Notify

## Endpoint

```http
POST /notify
```

## Request

```json
{
  "documentId": "uuid",
  "fileName": "invoice.pdf",
  "status": "COMPLETED"
}
```

## Response

```json
{
  "status": "sent"
}
```

---

# Export Service — Generate PDF

## Endpoint

```http
POST /export
```

## Request

```json
{
  "documentId": "uuid",
  "fileName": "invoice.pdf",
  "summary": "Invoice from ABC Corp",
  "extractedText": "...",
  "structuredData": "{\"vendorName\": \"ABC Corp\", \"amount\": 1500}"
}
```

## Response

Raw PDF bytes (`application/pdf`)

---

# 15. Docker Setup

# Docker Compose Services

```text
frontend
java-api
python-ai
notification-service
export-service
postgres
```

---

# Example docker-compose.yml

```yaml
services:

  frontend:
    build: ./frontend
    ports:
      - "3000:80"

  java-api:
    build: ./java-api
    ports:
      - "8080:8080"
    depends_on:
      - postgres
      - python-ai
      - notification-service
      - export-service

  python-ai:
    build: ./python-ai
    ports:
      - "8000:8000"

  notification-service:
    build: ./notification-service
    ports:
      - "8001:8001"

  export-service:
    build: ./export-service
    ports:
      - "8002:8002"

  postgres:
    image: postgres:17
    environment:
      POSTGRES_DB: documentdb
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
```

---

# 16. Deployment Plan

# Initial Deployment

Deploy MVP using:

- Docker Compose
- Single VM or EC2 instance

---

# Suggested AWS Services

| Service | Purpose |
|---|---|
| EC2 | App hosting |
| RDS | PostgreSQL |
| ECR | Docker registry |

---

# 17. Security Requirements

# Minimum Security

- Validate file types
- Restrict upload size
- Environment variables for secrets
- Do not expose AI service publicly
- Backend-only AI integration
- Avoid hardcoded credentials

---

# 18. CI/CD

# GitHub Actions Goals

Pipeline should:

- Build frontend
- Build Java backend
- Build Python AI service
- Build Notification Service
- Build Export Service
- Run tests (all services)
- Build Docker images

---

# 19. Development Phases

# Phase 1 — Backend MVP

Tasks:

- Spring Boot setup
- PostgreSQL integration
- Upload API
- Database persistence

Deliverable:

Working Java backend.

---

# Phase 2 — AI Service

Tasks:

- FastAPI setup
- OCR integration
- AI summarization
- Internal REST communication

Deliverable:

Working AI analysis flow.

---

# Phase 3 — Frontend

Tasks:

- React setup
- Upload UI
- Document list
- Result display

Deliverable:

Working end-to-end application.

---

# Phase 4 — Docker

Tasks:

- Dockerfiles
- Docker Compose
- Service networking

Deliverable:

Containerized local setup.

---

# Phase 5 — Deployment

Tasks:

- AWS deployment
- Environment configs
- Public access

Deliverable:

Live deployed project.

---

# Phase 6 — CI/CD

Tasks:

- GitHub Actions
- Docker image builds
- Automated workflows

Deliverable:

Professional engineering workflow.

---

# 20. Future Enhancements

Possible future features:

- Kafka
- Kubernetes
- Terraform
- JWT authentication
- AWS S3
- Azure Functions
- GCP Cloud Run
- Vector database
- Semantic search
- Chat with document
- RAG pipeline

These are OPTIONAL future enhancements.

---

# 21. Portfolio Positioning

This project is intended to demonstrate:

- AI-enabled backend engineering
- Service-oriented architecture
- Java + Python integration
- Containerized applications
- Cloud-ready systems
- Enterprise-style backend design

---

# 22. Success Criteria

The MVP is considered successful when:

- Documents can be uploaded
- AI analysis works
- Results are stored
- Frontend displays results
- Notifications fire after document analysis completes
- Completed documents can be exported as PDF
- Docker Compose runs all five services successfully
- Application can be deployed publicly

---

# 23. Recommended Development Approach

IMPORTANT:

Do NOT attempt to generate the entire system at once using AI coding agents.

Recommended approach:

1. Build Java backend first
2. Add database
3. Add upload flow
4. Add Python AI service
5. Add frontend
6. Add Docker
7. Add deployment

Work incrementally.

Commit frequently.

Validate each layer before proceeding.

---

# 24. Final Vision

The project should remain:

- small enough to complete
- architecturally clean
- easy to explain in interviews
- modern enough to demonstrate current engineering trends

The goal is NOT enterprise-scale complexity.

The goal is demonstrating modern engineering capability.