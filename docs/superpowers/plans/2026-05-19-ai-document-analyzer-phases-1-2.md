# AI Document Analyzer — Phases 1 & 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully containerized, AI-powered document analysis backend — Spring Boot API + Python FastAPI AI service + PostgreSQL — runnable with `docker compose up --build` and testable via curl.

**Architecture:** Client POSTs a document to the Java API, which encodes it as base64 and calls the Python AI service. Python decodes the file and sends it to Gemini as inline_data, returning summary + structured extraction. Java persists results to PostgreSQL and returns the full document record.

**Tech Stack:** Java 21 / Spring Boot 3.3 / Gradle, Python 3.12 / FastAPI / uvicorn, PostgreSQL 17, Google Gemini (`gemini-2.0-flash`), Docker Compose

---

## File Map

```
ai-document-analyzer/
├── .gitignore
├── .env.example
├── docker-compose.yml
│
├── python-ai/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                          FastAPI app entry point
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── routes.py                    /analyze + /health endpoints
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   └── analyzer.py                  Gemini integration
│   │   └── models/
│   │       ├── __init__.py
│   │       └── schemas.py                   Pydantic request/response models
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py                      TestClient fixture
│   │   └── test_routes.py                   Route tests
│   ├── pytest.ini
│   ├── requirements.txt
│   └── Dockerfile
│
└── java-api/
    ├── build.gradle
    ├── settings.gradle
    ├── Dockerfile
    └── src/
        ├── main/
        │   ├── java/com/example/documentanalyzer/
        │   │   ├── DocumentAnalyzerApplication.java
        │   │   ├── entity/Document.java
        │   │   ├── repository/DocumentRepository.java
        │   │   ├── dto/
        │   │   │   ├── DocumentResponse.java
        │   │   │   ├── AnalyzeRequest.java
        │   │   │   └── AnalyzeResponse.java
        │   │   ├── client/PythonAiClient.java
        │   │   ├── config/WebClientConfig.java
        │   │   ├── service/DocumentService.java
        │   │   ├── controller/DocumentController.java
        │   │   └── exception/GlobalExceptionHandler.java
        │   └── resources/application.yml
        └── test/
            ├── java/com/example/documentanalyzer/
            │   ├── controller/DocumentControllerTest.java
            │   └── service/DocumentServiceTest.java
            └── resources/application.yml
```

---

## Task 1: Root project scaffold

**Files:**
- Create: `.gitignore`
- Create: `.env.example`

- [ ] **Step 1: Create .gitignore**

```
# Environment
.env

# Java
.gradle/
build/
*.jar
*.class
out/

# Python
__pycache__/
*.pyc
.pytest_cache/
venv/
.venv/

# IDE
.idea/
.vscode/
*.iml

# macOS
.DS_Store
```

- [ ] **Step 2: Create .env.example**

```
POSTGRES_DB=documentdb
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
GEMINI_API_KEY=your-gemini-api-key-here
```

- [ ] **Step 3: Commit**

```bash
git add .gitignore .env.example
git commit -m "chore: add root project scaffold"
```

---

## Task 2: Python service scaffold and schemas

**Files:**
- Create: `python-ai/requirements.txt`
- Create: `python-ai/pytest.ini`
- Create: `python-ai/app/__init__.py` (empty)
- Create: `python-ai/app/models/__init__.py` (empty)
- Create: `python-ai/app/api/__init__.py` (empty)
- Create: `python-ai/app/services/__init__.py` (empty)
- Create: `python-ai/tests/__init__.py` (empty)
- Create: `python-ai/app/models/schemas.py`
- Test: `python-ai/tests/test_routes.py`

- [ ] **Step 1: Create requirements.txt**

```
fastapi==0.115.0
uvicorn[standard]==0.32.0
google-generativeai==0.8.3
pydantic==2.9.2
httpx==0.27.2
pytest==8.3.3
```

- [ ] **Step 2: Create pytest.ini**

```ini
[pytest]
testpaths = tests
```

- [ ] **Step 3: Create all empty __init__.py files**

```bash
mkdir -p python-ai/app/api python-ai/app/services python-ai/app/models python-ai/tests
touch python-ai/app/__init__.py
touch python-ai/app/api/__init__.py
touch python-ai/app/services/__init__.py
touch python-ai/app/models/__init__.py
touch python-ai/tests/__init__.py
```

- [ ] **Step 4: Create app/models/schemas.py**

```python
from typing import Any
from pydantic import BaseModel


class AnalyzeRequest(BaseModel):
    fileContent: str  # base64-encoded file bytes
    fileName: str
    fileType: str


class AnalyzeResponse(BaseModel):
    summary: str
    extractedText: str
    structuredData: dict[str, Any]
```

- [ ] **Step 5: Commit**

```bash
git add python-ai/
git commit -m "feat(python-ai): add project scaffold and Pydantic schemas"
```

---

## Task 3: Python Gemini analyzer service

**Files:**
- Create: `python-ai/app/services/analyzer.py`

- [ ] **Step 1: Install dependencies locally (for running tests)**

```bash
cd python-ai
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

- [ ] **Step 2: Create app/services/analyzer.py**

```python
import base64
import json
import os
import re

import google.generativeai as genai

PROMPT = """Analyze this document and return ONLY a JSON object with exactly these fields:
{
  "summary": "A 1-2 sentence summary of the document",
  "extractedText": "The full text content extracted from the document",
  "structuredData": {}
}

For structuredData, extract any fields present in the document such as:
vendorName, amount, invoiceDate, invoiceNumber, recipient, etc.
Include only fields that are actually present.
Return ONLY valid JSON — no markdown, no explanation, no code fences."""


def analyze_document(file_content_b64: str, file_type: str) -> dict:
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    model = genai.GenerativeModel("gemini-2.0-flash")
    file_bytes = base64.b64decode(file_content_b64)

    response = model.generate_content([
        {"mime_type": file_type, "data": file_bytes},
        PROMPT,
    ])

    text = response.text.strip()
    # Strip markdown code fences Gemini sometimes adds despite instructions
    text = re.sub(r"^```(?:json)?\n?", "", text)
    text = re.sub(r"\n?```$", "", text)

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {
            "summary": text,
            "extractedText": text,
            "structuredData": {},
        }
```

- [ ] **Step 3: Commit**

```bash
git add python-ai/app/services/analyzer.py
git commit -m "feat(python-ai): add Gemini analyzer service"
```

---

## Task 4: Python FastAPI routes and app

**Files:**
- Create: `python-ai/app/api/routes.py`
- Create: `python-ai/app/main.py`
- Create: `python-ai/tests/conftest.py`
- Test: `python-ai/tests/test_routes.py`

- [ ] **Step 1: Write failing tests first**

Create `python-ai/tests/conftest.py`:
```python
import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    return TestClient(app)
```

Create `python-ai/tests/test_routes.py`:
```python
import base64
from unittest.mock import patch


def test_health_returns_ok(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_analyze_returns_structured_response(client):
    fake_result = {
        "summary": "Invoice from Test Corp",
        "extractedText": "Invoice #1234 from Test Corp",
        "structuredData": {"vendorName": "Test Corp", "amount": 500},
    }
    with patch("app.api.routes.analyze_document", return_value=fake_result):
        response = client.post("/analyze", json={
            "fileContent": base64.b64encode(b"fake pdf bytes").decode(),
            "fileName": "invoice.pdf",
            "fileType": "application/pdf",
        })

    assert response.status_code == 200
    data = response.json()
    assert data["summary"] == "Invoice from Test Corp"
    assert data["structuredData"]["vendorName"] == "Test Corp"


def test_analyze_returns_500_on_error(client):
    with patch("app.api.routes.analyze_document", side_effect=Exception("Gemini unavailable")):
        response = client.post("/analyze", json={
            "fileContent": base64.b64encode(b"fake pdf bytes").decode(),
            "fileName": "invoice.pdf",
            "fileType": "application/pdf",
        })

    assert response.status_code == 500
```

- [ ] **Step 2: Run tests — expect ImportError (app.main doesn't exist yet)**

```bash
cd python-ai
source .venv/bin/activate
pytest tests/ -v
```

Expected: `ModuleNotFoundError: No module named 'app.main'`

- [ ] **Step 3: Create app/api/routes.py**

```python
from fastapi import APIRouter, HTTPException

from app.models.schemas import AnalyzeRequest, AnalyzeResponse
from app.services.analyzer import analyze_document

router = APIRouter()


@router.get("/health")
def health():
    return {"status": "ok"}


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze(request: AnalyzeRequest):
    try:
        result = analyze_document(request.fileContent, request.fileType)
        return AnalyzeResponse(
            summary=result.get("summary", ""),
            extractedText=result.get("extractedText", ""),
            structuredData=result.get("structuredData", {}),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

- [ ] **Step 4: Create app/main.py**

```python
from fastapi import FastAPI

from app.api.routes import router

app = FastAPI(title="AI Document Analyzer - Python Service")
app.include_router(router)
```

- [ ] **Step 5: Run tests — expect all to pass**

```bash
pytest tests/ -v
```

Expected output:
```
tests/test_routes.py::test_health_returns_ok PASSED
tests/test_routes.py::test_analyze_returns_structured_response PASSED
tests/test_routes.py::test_analyze_returns_500_on_error PASSED
3 passed
```

- [ ] **Step 6: Commit**

```bash
git add python-ai/app/api/routes.py python-ai/app/main.py python-ai/tests/
git commit -m "feat(python-ai): add FastAPI routes with tests"
```

---

## Task 5: Python Dockerfile

**Files:**
- Create: `python-ai/Dockerfile`

- [ ] **Step 1: Create python-ai/Dockerfile**

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 2: Verify Docker build succeeds**

```bash
cd python-ai
docker build -t python-ai-test .
```

Expected: `Successfully built ...` with no errors.

- [ ] **Step 3: Clean up test image**

```bash
docker rmi python-ai-test
```

- [ ] **Step 4: Commit**

```bash
git add python-ai/Dockerfile
git commit -m "feat(python-ai): add Dockerfile"
```

---

## Task 6: Java project scaffold

**Files:**
- Create: `java-api/settings.gradle`
- Create: `java-api/build.gradle`
- Create: `java-api/src/main/java/com/example/documentanalyzer/DocumentAnalyzerApplication.java`
- Create: `java-api/src/main/resources/application.yml`
- Create: `java-api/src/test/resources/application.yml`

- [ ] **Step 1: Create java-api/settings.gradle**

```groovy
rootProject.name = 'document-analyzer'
```

- [ ] **Step 2: Create java-api/build.gradle**

```groovy
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.3.5'
    id 'io.spring.dependency-management' version '1.1.6'
}

group = 'com.example'
version = '0.0.1-SNAPSHOT'

java {
    sourceCompatibility = JavaVersion.VERSION_21
}

configurations {
    compileOnly {
        extendsFrom annotationProcessor
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework:spring-webflux'
    implementation 'io.projectreactor.netty:reactor-netty-http'
    compileOnly 'org.projectlombok:lombok'
    runtimeOnly 'org.postgresql:postgresql'
    annotationProcessor 'org.projectlombok:lombok'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testRuntimeOnly 'com.h2database:h2'
}

tasks.named('test') {
    useJUnitPlatform()
}
```

- [ ] **Step 3: Create directory structure**

```bash
mkdir -p java-api/src/main/java/com/example/documentanalyzer/{entity,repository,dto,client,config,service,controller,exception}
mkdir -p java-api/src/main/resources
mkdir -p java-api/src/test/java/com/example/documentanalyzer/{controller,service}
mkdir -p java-api/src/test/resources
```

- [ ] **Step 4: Create DocumentAnalyzerApplication.java**

```java
package com.example.documentanalyzer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DocumentAnalyzerApplication {
    public static void main(String[] args) {
        SpringApplication.run(DocumentAnalyzerApplication.class, args);
    }
}
```

- [ ] **Step 5: Create src/main/resources/application.yml**

```yaml
spring:
  datasource:
    url: ${DB_URL:jdbc:postgresql://localhost:5432/documentdb}
    username: ${DB_USER:postgres}
    password: ${DB_PASSWORD:postgres}
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false
  servlet:
    multipart:
      max-file-size: 10MB
      max-request-size: 10MB

python-ai:
  base-url: ${PYTHON_AI_URL:http://localhost:8000}
  timeout-seconds: 60
```

- [ ] **Step 6: Create src/test/resources/application.yml**

```yaml
spring:
  datasource:
    url: jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL
    driver-class-name: org.h2.Driver
  jpa:
    hibernate:
      ddl-auto: create-drop
    show-sql: false
  servlet:
    multipart:
      max-file-size: 10MB
      max-request-size: 10MB

python-ai:
  base-url: http://localhost:8000
  timeout-seconds: 60
```

- [ ] **Step 7: Verify Gradle resolves dependencies (requires Java 21 installed locally)**

```bash
cd java-api
gradle dependencies --configuration compileClasspath
```

Expected: dependency tree with no resolution errors.

- [ ] **Step 8: Commit**

```bash
git add java-api/
git commit -m "feat(java-api): add Spring Boot project scaffold"
```

---

## Task 7: Java Document entity and repository

**Files:**
- Create: `java-api/src/main/java/com/example/documentanalyzer/entity/Document.java`
- Create: `java-api/src/main/java/com/example/documentanalyzer/repository/DocumentRepository.java`

- [ ] **Step 1: Create entity/Document.java**

```java
package com.example.documentanalyzer.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "documents")
@Getter
@Setter
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "file_type")
    private String fileType;

    @Column
    private String status;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(name = "extracted_text", columnDefinition = "TEXT")
    private String extractedText;

    @Column(name = "extracted_json", columnDefinition = "TEXT")
    private String extractedJson;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
```

- [ ] **Step 2: Create repository/DocumentRepository.java**

```java
package com.example.documentanalyzer.repository;

import com.example.documentanalyzer.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface DocumentRepository extends JpaRepository<Document, UUID> {
}
```

- [ ] **Step 3: Commit**

```bash
git add java-api/src/main/java/com/example/documentanalyzer/entity/ \
        java-api/src/main/java/com/example/documentanalyzer/repository/
git commit -m "feat(java-api): add Document entity and repository"
```

---

## Task 8: Java DTOs

**Files:**
- Create: `java-api/src/main/java/com/example/documentanalyzer/dto/DocumentResponse.java`
- Create: `java-api/src/main/java/com/example/documentanalyzer/dto/AnalyzeRequest.java`
- Create: `java-api/src/main/java/com/example/documentanalyzer/dto/AnalyzeResponse.java`

- [ ] **Step 1: Create dto/DocumentResponse.java**

```java
package com.example.documentanalyzer.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record DocumentResponse(
        UUID id,
        String fileName,
        String fileType,
        String status,
        String summary,
        String extractedText,
        String extractedJson,
        LocalDateTime createdAt
) {}
```

- [ ] **Step 2: Create dto/AnalyzeRequest.java**

```java
package com.example.documentanalyzer.dto;

public record AnalyzeRequest(
        String fileContent,
        String fileName,
        String fileType
) {}
```

- [ ] **Step 3: Create dto/AnalyzeResponse.java**

```java
package com.example.documentanalyzer.dto;

import com.fasterxml.jackson.databind.JsonNode;

public record AnalyzeResponse(
        String summary,
        String extractedText,
        JsonNode structuredData
) {}
```

- [ ] **Step 4: Commit**

```bash
git add java-api/src/main/java/com/example/documentanalyzer/dto/
git commit -m "feat(java-api): add DTOs"
```

---

## Task 9: Java WebClient config and PythonAiClient

**Files:**
- Create: `java-api/src/main/java/com/example/documentanalyzer/config/WebClientConfig.java`
- Create: `java-api/src/main/java/com/example/documentanalyzer/client/PythonAiClient.java`

- [ ] **Step 1: Create config/WebClientConfig.java**

```java
package com.example.documentanalyzer.config;

import io.netty.channel.ChannelOption;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;

@Configuration
public class WebClientConfig {

    @Value("${python-ai.base-url}")
    private String pythonAiBaseUrl;

    @Value("${python-ai.timeout-seconds}")
    private int timeoutSeconds;

    @Bean
    public WebClient pythonAiWebClient() {
        HttpClient httpClient = HttpClient.create()
                .responseTimeout(Duration.ofSeconds(timeoutSeconds));

        return WebClient.builder()
                .baseUrl(pythonAiBaseUrl)
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .build();
    }
}
```

- [ ] **Step 2: Create client/PythonAiClient.java**

```java
package com.example.documentanalyzer.client;

import com.example.documentanalyzer.dto.AnalyzeRequest;
import com.example.documentanalyzer.dto.AnalyzeResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

@Component
public class PythonAiClient {

    private final WebClient webClient;

    public PythonAiClient(@Qualifier("pythonAiWebClient") WebClient webClient) {
        this.webClient = webClient;
    }

    public AnalyzeResponse analyze(AnalyzeRequest request) {
        return webClient.post()
                .uri("/analyze")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(AnalyzeResponse.class)
                .block();
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add java-api/src/main/java/com/example/documentanalyzer/config/ \
        java-api/src/main/java/com/example/documentanalyzer/client/
git commit -m "feat(java-api): add WebClient config and PythonAiClient"
```

---

## Task 10: Java DocumentService

**Files:**
- Create: `java-api/src/main/java/com/example/documentanalyzer/service/DocumentService.java`
- Test: `java-api/src/test/java/com/example/documentanalyzer/service/DocumentServiceTest.java`

- [ ] **Step 1: Write failing test first**

Create `java-api/src/test/java/com/example/documentanalyzer/service/DocumentServiceTest.java`:

```java
package com.example.documentanalyzer.service;

import com.example.documentanalyzer.client.PythonAiClient;
import com.example.documentanalyzer.dto.AnalyzeResponse;
import com.example.documentanalyzer.dto.DocumentResponse;
import com.example.documentanalyzer.entity.Document;
import com.example.documentanalyzer.repository.DocumentRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DocumentServiceTest {

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private PythonAiClient pythonAiClient;

    @Spy
    private ObjectMapper objectMapper;

    @InjectMocks
    private DocumentService documentService;

    @Test
    void upload_withValidPdf_returnsCompletedDocument() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "invoice.pdf", "application/pdf", "pdf content".getBytes()
        );

        when(documentRepository.save(any(Document.class))).thenAnswer(inv -> {
            Document doc = inv.getArgument(0);
            if (doc.getId() == null) doc.setId(UUID.randomUUID());
            return doc;
        });
        when(pythonAiClient.analyze(any())).thenReturn(
                new AnalyzeResponse("Invoice summary", "raw text", null)
        );

        DocumentResponse result = documentService.upload(file);

        assertThat(result.fileName()).isEqualTo("invoice.pdf");
        assertThat(result.status()).isEqualTo("COMPLETED");
    }

    @Test
    void upload_whenPythonFails_returnsFailedDocument() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "invoice.pdf", "application/pdf", "pdf content".getBytes()
        );

        when(documentRepository.save(any(Document.class))).thenAnswer(inv -> {
            Document doc = inv.getArgument(0);
            if (doc.getId() == null) doc.setId(UUID.randomUUID());
            return doc;
        });
        when(pythonAiClient.analyze(any())).thenThrow(new RuntimeException("Python down"));

        DocumentResponse result = documentService.upload(file);

        assertThat(result.status()).isEqualTo("FAILED");
        assertThat(result.summary()).contains("Python down");
    }

    @Test
    void upload_withUnsupportedType_throwsIllegalArgumentException() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "notes.txt", "text/plain", "content".getBytes()
        );

        assertThatThrownBy(() -> documentService.upload(file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("not allowed");
    }
}
```

- [ ] **Step 2: Run test — expect compilation failure (DocumentService doesn't exist)**

```bash
cd java-api
gradle test --tests "com.example.documentanalyzer.service.DocumentServiceTest" 2>&1 | tail -20
```

Expected: compilation error — `DocumentService` not found.

- [ ] **Step 3: Create service/DocumentService.java**

```java
package com.example.documentanalyzer.service;

import com.example.documentanalyzer.client.PythonAiClient;
import com.example.documentanalyzer.dto.AnalyzeRequest;
import com.example.documentanalyzer.dto.AnalyzeResponse;
import com.example.documentanalyzer.dto.DocumentResponse;
import com.example.documentanalyzer.entity.Document;
import com.example.documentanalyzer.repository.DocumentRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final PythonAiClient pythonAiClient;
    private final ObjectMapper objectMapper;

    private static final List<String> ALLOWED_TYPES = List.of(
            "application/pdf", "image/png", "image/jpg", "image/jpeg"
    );

    public DocumentResponse upload(MultipartFile file) throws IOException {
        validateFile(file);

        Document document = new Document();
        document.setFileName(file.getOriginalFilename());
        document.setFileType(file.getContentType());
        document.setStatus("PENDING");
        documentRepository.save(document);

        try {
            document.setStatus("PROCESSING");
            documentRepository.save(document);

            String base64Content = Base64.getEncoder().encodeToString(file.getBytes());
            AnalyzeRequest request = new AnalyzeRequest(
                    base64Content, file.getOriginalFilename(), file.getContentType()
            );

            AnalyzeResponse response = pythonAiClient.analyze(request);
            document.setStatus("COMPLETED");
            document.setSummary(response.summary());
            document.setExtractedText(response.extractedText());
            if (response.structuredData() != null) {
                document.setExtractedJson(objectMapper.writeValueAsString(response.structuredData()));
            }
        } catch (Exception e) {
            document.setStatus("FAILED");
            document.setSummary("Analysis failed: " + e.getMessage());
        }

        documentRepository.save(document);
        return toResponse(document);
    }

    public List<DocumentResponse> findAll() {
        return documentRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public DocumentResponse findById(UUID id) {
        return documentRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new RuntimeException("Document not found: " + id));
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new IllegalArgumentException("File type not allowed: " + file.getContentType());
        }
    }

    private DocumentResponse toResponse(Document doc) {
        return new DocumentResponse(
                doc.getId(), doc.getFileName(), doc.getFileType(),
                doc.getStatus(), doc.getSummary(), doc.getExtractedText(),
                doc.getExtractedJson(), doc.getCreatedAt()
        );
    }
}
```

- [ ] **Step 4: Run test — expect all to pass**

```bash
gradle test --tests "com.example.documentanalyzer.service.DocumentServiceTest"
```

Expected:
```
DocumentServiceTest > upload_withValidPdf_returnsCompletedDocument() PASSED
DocumentServiceTest > upload_whenPythonFails_returnsFailedDocument() PASSED
DocumentServiceTest > upload_withUnsupportedType_throwsIllegalArgumentException() PASSED
3 tests completed, 0 failures
```

- [ ] **Step 5: Commit**

```bash
git add java-api/src/main/java/com/example/documentanalyzer/service/ \
        java-api/src/test/java/com/example/documentanalyzer/service/
git commit -m "feat(java-api): add DocumentService with tests"
```

---

## Task 11: Java DocumentController and GlobalExceptionHandler

**Files:**
- Create: `java-api/src/main/java/com/example/documentanalyzer/controller/DocumentController.java`
- Create: `java-api/src/main/java/com/example/documentanalyzer/exception/GlobalExceptionHandler.java`
- Test: `java-api/src/test/java/com/example/documentanalyzer/controller/DocumentControllerTest.java`

- [ ] **Step 1: Write failing test first**

Create `java-api/src/test/java/com/example/documentanalyzer/controller/DocumentControllerTest.java`:

```java
package com.example.documentanalyzer.controller;

import com.example.documentanalyzer.dto.DocumentResponse;
import com.example.documentanalyzer.service.DocumentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(DocumentController.class)
class DocumentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DocumentService documentService;

    @Test
    void upload_returnsOkWithDocumentResponse() throws Exception {
        UUID id = UUID.randomUUID();
        DocumentResponse response = new DocumentResponse(
                id, "invoice.pdf", "application/pdf", "COMPLETED",
                "Invoice summary", "raw text", "{}", LocalDateTime.now()
        );
        when(documentService.upload(any())).thenReturn(response);

        MockMultipartFile file = new MockMultipartFile(
                "file", "invoice.pdf", "application/pdf", "pdf bytes".getBytes()
        );

        mockMvc.perform(multipart("/api/documents").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id.toString()))
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.fileName").value("invoice.pdf"));
    }

    @Test
    void findAll_returnsEmptyList() throws Exception {
        when(documentService.findAll()).thenReturn(List.of());

        mockMvc.perform(get("/api/documents"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void findById_returnsDocument() throws Exception {
        UUID id = UUID.randomUUID();
        DocumentResponse response = new DocumentResponse(
                id, "receipt.png", "image/png", "COMPLETED",
                "Receipt summary", "raw text", "{}", LocalDateTime.now()
        );
        when(documentService.findById(id)).thenReturn(response);

        mockMvc.perform(get("/api/documents/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fileName").value("receipt.png"));
    }

    @Test
    void upload_withInvalidType_returnsBadRequest() throws Exception {
        when(documentService.upload(any()))
                .thenThrow(new IllegalArgumentException("File type not allowed: text/plain"));

        MockMultipartFile file = new MockMultipartFile(
                "file", "notes.txt", "text/plain", "content".getBytes()
        );

        mockMvc.perform(multipart("/api/documents").file(file))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }
}
```

- [ ] **Step 2: Run test — expect compilation failure**

```bash
gradle test --tests "com.example.documentanalyzer.controller.DocumentControllerTest" 2>&1 | tail -20
```

Expected: compilation error — `DocumentController` not found.

- [ ] **Step 3: Create controller/DocumentController.java**

```java
package com.example.documentanalyzer.controller;

import com.example.documentanalyzer.dto.DocumentResponse;
import com.example.documentanalyzer.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping
    public ResponseEntity<DocumentResponse> upload(@RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(documentService.upload(file));
    }

    @GetMapping
    public ResponseEntity<List<DocumentResponse>> findAll() {
        return ResponseEntity.ok(documentService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DocumentResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(documentService.findById(id));
    }
}
```

- [ ] **Step 4: Create exception/GlobalExceptionHandler.java**

```java
package com.example.documentanalyzer.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntime(RuntimeException e) {
        if (e.getMessage() != null && e.getMessage().startsWith("Document not found")) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
    }
}
```

- [ ] **Step 5: Run all tests — expect all to pass**

```bash
gradle test
```

Expected:
```
DocumentControllerTest > upload_returnsOkWithDocumentResponse() PASSED
DocumentControllerTest > findAll_returnsEmptyList() PASSED
DocumentControllerTest > findById_returnsDocument() PASSED
DocumentControllerTest > upload_withInvalidType_returnsBadRequest() PASSED
DocumentServiceTest > upload_withValidPdf_returnsCompletedDocument() PASSED
DocumentServiceTest > upload_whenPythonFails_returnsFailedDocument() PASSED
DocumentServiceTest > upload_withUnsupportedType_throwsIllegalArgumentException() PASSED
7 tests completed, 0 failures
```

- [ ] **Step 6: Commit**

```bash
git add java-api/src/main/java/com/example/documentanalyzer/controller/ \
        java-api/src/main/java/com/example/documentanalyzer/exception/ \
        java-api/src/test/java/com/example/documentanalyzer/controller/
git commit -m "feat(java-api): add DocumentController and GlobalExceptionHandler with tests"
```

---

## Task 12: Java Dockerfile

**Files:**
- Create: `java-api/Dockerfile`

- [ ] **Step 1: Create java-api/Dockerfile**

```dockerfile
# Build stage
FROM gradle:8.10-jdk21 AS build
WORKDIR /app
COPY build.gradle settings.gradle ./
COPY src ./src
RUN gradle bootJar --no-daemon

# Runtime stage
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

- [ ] **Step 2: Verify Docker build succeeds (this will take a few minutes)**

```bash
cd java-api
docker build -t java-api-test .
```

Expected: `Successfully built ...` — the multi-stage build compiles the JAR and packages it into the runtime image.

- [ ] **Step 3: Clean up test image**

```bash
docker rmi java-api-test
```

- [ ] **Step 4: Commit**

```bash
git add java-api/Dockerfile
git commit -m "feat(java-api): add multi-stage Dockerfile"
```

---

## Task 13: Docker Compose and integration smoke test

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: Create docker-compose.yml**

```yaml
services:
  postgres:
    image: postgres:17
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 5s
      timeout: 5s
      retries: 5

  python-ai:
    build: ./python-ai
    ports:
      - "8000:8000"
    environment:
      GEMINI_API_KEY: ${GEMINI_API_KEY}
    healthcheck:
      test: ["CMD-SHELL", "curl -sf http://localhost:8000/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5

  java-api:
    build: ./java-api
    ports:
      - "8080:8080"
    depends_on:
      postgres:
        condition: service_healthy
      python-ai:
        condition: service_healthy
    environment:
      DB_URL: jdbc:postgresql://postgres:5432/${POSTGRES_DB}
      DB_USER: ${POSTGRES_USER}
      DB_PASSWORD: ${POSTGRES_PASSWORD}
      PYTHON_AI_URL: http://python-ai:8000
```

- [ ] **Step 2: Create .env from .env.example and fill in your Gemini API key**

```bash
cp .env.example .env
# Edit .env and replace 'your-gemini-api-key-here' with your actual key
# Get one free at https://aistudio.google.com/app/apikey
```

- [ ] **Step 3: Build and start all services**

```bash
docker compose up --build
```

Expected: all three containers start, java-api logs show `Started DocumentAnalyzerApplication`.

- [ ] **Step 4: Verify health endpoint**

```bash
curl http://localhost:8000/health
```

Expected: `{"status":"ok"}`

- [ ] **Step 5: Verify documents list endpoint**

```bash
curl http://localhost:8080/api/documents
```

Expected: `[]`

- [ ] **Step 6: Upload a test document**

```bash
# Download a sample PDF or use any PDF on your machine
curl -X POST http://localhost:8080/api/documents \
  -F "file=@/path/to/your/invoice.pdf"
```

Expected: JSON response with `"status": "COMPLETED"`, a `summary`, and `structuredData`.

- [ ] **Step 7: Verify the document was persisted**

```bash
curl http://localhost:8080/api/documents
```

Expected: array with the uploaded document.

- [ ] **Step 8: Commit**

```bash
git add docker-compose.yml
git commit -m "feat: add Docker Compose with health checks"
```

---

## Verification Checklist

Run these checks before declaring Phases 1–2 complete:

- [ ] `docker compose up --build` starts all three services without errors
- [ ] `curl http://localhost:8000/health` returns `{"status":"ok"}`
- [ ] `curl http://localhost:8080/api/documents` returns `[]`
- [ ] `POST /api/documents` with a PDF returns `"status": "COMPLETED"` and a non-empty `summary`
- [ ] `GET /api/documents` shows the uploaded document
- [ ] `GET /api/documents/{id}` returns the full record
- [ ] Uploading an unsupported file type (`.txt`) returns HTTP 400
- [ ] `gradle test` in `java-api/` shows 7 tests passing, 0 failures
- [ ] `pytest tests/ -v` in `python-ai/` shows 3 tests passing, 0 failures
- [ ] `.env` is in `.gitignore` and not committed
