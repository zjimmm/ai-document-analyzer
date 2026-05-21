# React Frontend — Design Spec

## Goal

Build a single-page React frontend that lets users upload documents and view AI analysis results, connecting to the existing Java Spring Boot API.

## Tech Stack

- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Axios (HTTP client)

---

## Architecture

Single-page app with no routing. One screen with two panels: upload form on the left, document list on the right. Clicking a document in the list shows its detail (summary, extracted text, structured JSON) below the list.

All API calls go through a single `api.ts` module using Axios pointed at `VITE_API_URL` (defaults to `http://localhost:8080`). State is managed with plain `useState` and `useEffect` in `App.tsx` — no external state library.

---

## File Structure

```
frontend/
├── src/
│   ├── api/
│   │   └── api.ts              — uploadDocument, getDocuments, getDocument
│   ├── types/
│   │   └── document.ts         — DocumentResponse TypeScript interface
│   ├── components/
│   │   ├── UploadForm.tsx       — File picker + upload button + loading/error state
│   │   ├── DocumentList.tsx     — List of documents with status badges
│   │   └── DocumentDetail.tsx  — Summary, extracted text, structured JSON display
│   └── App.tsx                 — Layout, state, wires all components together
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── Dockerfile
```

---

## Component Responsibilities

### `api.ts`
- `uploadDocument(file: File): Promise<DocumentResponse>` — POST /api/documents (multipart)
- `getDocuments(): Promise<DocumentResponse[]>` — GET /api/documents
- `getDocument(id: string): Promise<DocumentResponse>` — GET /api/documents/:id

### `document.ts`
```typescript
interface DocumentResponse {
  id: string;
  fileName: string;
  fileType: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  summary: string | null;
  extractedText: string | null;
  extractedJson: string | null;
  createdAt: string;
}
```

### `UploadForm.tsx`
- File input restricted to `application/pdf,image/png,image/jpeg`
- Client-side file type validation before sending
- Disabled + spinner during upload
- Inline error message on failure
- Calls `onUploadComplete` callback when done

### `DocumentList.tsx`
- Renders list of documents with file name, status badge, and date
- Status badge colors: PENDING=yellow, PROCESSING=blue, COMPLETED=green, FAILED=red
- Highlights selected document
- Calls `onSelect` callback when a document is clicked

### `DocumentDetail.tsx`
- Shows summary, extracted text, and structured JSON (`extractedJson` is a JSON string from the API — parse with `JSON.parse` then format with `JSON.stringify(..., null, 2)` for display)
- Shows failure reason (from `summary` field) when status is FAILED
- Empty state when no document is selected

### `App.tsx`
- Holds state: `documents`, `selectedDocument`, `loading`
- Fetches document list on mount and after each upload
- Layout: two-column on desktop, stacked on mobile

---

## Docker Integration

### `frontend/Dockerfile`
Two-stage build:
1. `node:20-alpine` — install deps, run `vite build`
2. `nginx:alpine` — serve `/dist` on port 80

`VITE_API_URL` passed as build arg for future deployment flexibility.

### Nginx config
Proxy `/api/*` requests to `java-api:8080` to avoid CORS issues in the browser.

### `docker-compose.yml` addition
```yaml
frontend:
  build:
    context: ./frontend
    args:
      VITE_API_URL: http://localhost:8080
  ports:
    - "3000:80"
  depends_on:
    java-api:
      condition: service_started
```

---

## Error Handling & UX

- Client-side file type validation (PDF, PNG, JPG, JPEG) before upload
- Loading spinner during upload and document list fetch
- Inline error messages (no toast library)
- Status badges with colors for PENDING, PROCESSING, COMPLETED, FAILED
- FAILED documents show failure reason from `summary` field

---

## Testing

- Vitest + React Testing Library
- Test `UploadForm`: renders, validates file type, shows error on bad type
- Test `DocumentList`: renders list, highlights selected item, shows status badges
- Test `DocumentDetail`: renders summary/extracted text/JSON, shows empty state
- Test `api.ts`: mock Axios, verify correct endpoints and payloads called
