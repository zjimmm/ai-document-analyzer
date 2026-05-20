# PRD — AI Document Analyzer

# 1. Project Overview

## Project Name

AI Document Analyzer

---

## Summary

AI Document Analyzer is a lightweight AI-powered document processing platform built using a microservice-style architecture.

The application allows users to upload documents such as invoices, receipts, and PDFs. A Java Spring Boot backend orchestrates the workflow while a dedicated Python AI service processes documents and returns AI-generated summaries and structured extracted data.

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
Spring Boot API
       |
       v
Python AI Service
       |
       v
PostgreSQL
```

---

# 5. Architecture Philosophy

The system follows a lightweight microservice-style architecture.

## Design Principles

### Separation of Concerns

- Java API handles orchestration and business logic
- Python service handles AI processing only
- Frontend handles UI only

---

### Independent Services

The Java API and Python AI service are separate applications:

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
| Gemini/OpenAI | AI summarization |

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

# 10. Functional Flow

# Upload Flow

```text
1. User uploads document from frontend
2. Spring Boot API receives upload
3. Java API stores metadata
4. Java API stores file
5. Java API calls Python AI service
6. Python AI analyzes document
7. AI result returned to Java API
8. Java API stores analysis result
9. Frontend displays analysis result
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
- Frontend APIs

The Java API is considered the main backend application.

---

# Python AI Service Responsibilities

The Python service owns ONLY:

- OCR
- AI summarization
- Field extraction
- AI prompt handling

The Python service should NOT handle:

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

# 14. Internal AI Service API

# Analyze Document

## Endpoint

```http
POST /analyze
```

## Request

```json
{
  "filePath": "/tmp/invoice.pdf"
}
```

## Response

```json
{
  "summary": "Invoice from ABC Corp",
  "structuredData": {
    "vendorName": "ABC Corp",
    "amount": 1500
  }
}
```

---

# 15. Docker Setup

# Docker Compose Services

```text
frontend
java-api
python-ai
postgres
```

---

# Example docker-compose.yml

```yaml
version: '3.9'

services:

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"

  java-api:
    build: ./java-api
    ports:
      - "8080:8080"
    depends_on:
      - postgres
      - python-ai

  python-ai:
    build: ./python-ai
    ports:
      - "8000:8000"

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
- Build Python service
- Run tests
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
- Docker Compose runs successfully
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