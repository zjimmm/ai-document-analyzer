# React Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page React frontend that lets users upload documents and view AI analysis results from the Java Spring Boot API.

**Architecture:** Single-page Vite + React + TypeScript app with Tailwind CSS. All API calls go through `src/api/api.ts` using Axios with relative URLs — a Vite dev proxy forwards `/api/*` to `http://localhost:8080` in development, and an nginx reverse proxy handles the same in Docker. State is managed with plain `useState`/`useEffect` in `App.tsx`.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, Axios, Vitest, React Testing Library

---

## File Map

| File | Purpose |
|------|---------|
| `frontend/package.json` | Dependencies and scripts |
| `frontend/vite.config.ts` | Vite + Vitest config, dev proxy |
| `frontend/tailwind.config.js` | Tailwind content paths |
| `frontend/src/index.css` | Tailwind directives |
| `frontend/src/main.tsx` | React entry point |
| `frontend/src/App.tsx` | Root layout, state, wires components |
| `frontend/src/types/document.ts` | `DocumentResponse` TypeScript interface |
| `frontend/src/api/api.ts` | `uploadDocument`, `getDocuments`, `getDocument` |
| `frontend/src/api/api.test.ts` | Axios mock tests for api.ts |
| `frontend/src/components/UploadForm.tsx` | File picker + upload button |
| `frontend/src/components/UploadForm.test.tsx` | UploadForm tests |
| `frontend/src/components/DocumentList.tsx` | Document list with status badges |
| `frontend/src/components/DocumentList.test.tsx` | DocumentList tests |
| `frontend/src/components/DocumentDetail.tsx` | Analysis result display |
| `frontend/src/components/DocumentDetail.test.tsx` | DocumentDetail tests |
| `frontend/src/test/setup.ts` | Vitest + jest-dom setup |
| `frontend/Dockerfile` | Two-stage Node build → nginx |
| `frontend/nginx.conf` | Serve static files + proxy `/api/*` |
| `docker-compose.yml` | Add frontend service (modify existing) |

---

## Task 1: Scaffold Vite React TypeScript project

**Files:**
- Create: `frontend/` (entire directory)

- [ ] **Step 1: Scaffold the project**

Run from the repo root (`/path/to/ai-document-analyzer`):

```bash
npm create vite@latest frontend -- --template react-ts
```

Expected output: `Done. Now run: cd frontend && npm install`

- [ ] **Step 2: Install dependencies**

```bash
cd frontend
npm install
npm install axios
npm install -D tailwindcss postcss autoprefixer vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
npx tailwindcss init -p
```

Expected: `tailwind.config.js` and `postcss.config.js` created.

- [ ] **Step 3: Configure Tailwind**

Replace contents of `frontend/tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

- [ ] **Step 4: Add Tailwind directives to CSS**

Replace contents of `frontend/src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 5: Configure Vite with Vitest and dev proxy**

Replace contents of `frontend/vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

- [ ] **Step 6: Add test setup file**

Create `frontend/src/test/setup.ts`:

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 7: Add test script to package.json**

In `frontend/package.json`, add to the `"scripts"` section:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 8: Delete boilerplate files**

```bash
rm frontend/src/App.css frontend/src/assets/react.svg public/vite.svg 2>/dev/null; true
```

- [ ] **Step 9: Verify dev server starts**

```bash
cd frontend && npm run dev
```

Expected: `Local: http://localhost:5173/` — then stop with Ctrl+C.

- [ ] **Step 10: Commit**

```bash
cd ..
git add frontend/
git commit -m "feat(frontend): scaffold Vite React TypeScript project with Tailwind and Vitest"
```

---

## Task 2: TypeScript types

**Files:**
- Create: `frontend/src/types/document.ts`

Types don't need tests — they're enforced by the TypeScript compiler.

- [ ] **Step 1: Create document types**

Create `frontend/src/types/document.ts`:

```ts
export interface DocumentResponse {
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

- [ ] **Step 2: Commit**

```bash
git add frontend/src/types/document.ts
git commit -m "feat(frontend): add DocumentResponse TypeScript interface"
```

---

## Task 3: API module

**Files:**
- Create: `frontend/src/api/api.ts`
- Create: `frontend/src/api/api.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/api/api.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockPost = vi.fn()
const mockGet = vi.fn()

vi.mock('axios', () => ({
  default: {
    create: () => ({ post: mockPost, get: mockGet }),
  },
}))

import { uploadDocument, getDocuments, getDocument } from './api'

describe('api', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uploadDocument posts to /api/documents with FormData', async () => {
    const mockDoc = { id: '1', fileName: 'test.pdf', status: 'PENDING' }
    mockPost.mockResolvedValue({ data: mockDoc })
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    const result = await uploadDocument(file)
    expect(mockPost).toHaveBeenCalledWith('/api/documents', expect.any(FormData))
    expect(result).toEqual(mockDoc)
  })

  it('getDocuments fetches from /api/documents', async () => {
    const mockDocs = [{ id: '1', fileName: 'test.pdf', status: 'COMPLETED' }]
    mockGet.mockResolvedValue({ data: mockDocs })
    const result = await getDocuments()
    expect(mockGet).toHaveBeenCalledWith('/api/documents')
    expect(result).toEqual(mockDocs)
  })

  it('getDocument fetches from /api/documents/:id', async () => {
    const mockDoc = { id: '123', fileName: 'test.pdf', status: 'COMPLETED' }
    mockGet.mockResolvedValue({ data: mockDoc })
    const result = await getDocument('123')
    expect(mockGet).toHaveBeenCalledWith('/api/documents/123')
    expect(result).toEqual(mockDoc)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend && npm test
```

Expected: FAIL — `uploadDocument`, `getDocuments`, `getDocument` not found.

- [ ] **Step 3: Implement the API module**

Create `frontend/src/api/api.ts`:

```ts
import axios from 'axios'
import type { DocumentResponse } from '../types/document'

const client = axios.create()

export async function uploadDocument(file: File): Promise<DocumentResponse> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await client.post<DocumentResponse>('/api/documents', formData)
  return data
}

export async function getDocuments(): Promise<DocumentResponse[]> {
  const { data } = await client.get<DocumentResponse[]>('/api/documents')
  return data
}

export async function getDocument(id: string): Promise<DocumentResponse> {
  const { data } = await client.get<DocumentResponse>(`/api/documents/${id}`)
  return data
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npm test
```

Expected: 3 tests passing.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/api/
git commit -m "feat(frontend): add API module with tests"
```

---

## Task 4: UploadForm component

**Files:**
- Create: `frontend/src/components/UploadForm.tsx`
- Create: `frontend/src/components/UploadForm.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/components/UploadForm.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockUploadDocument = vi.fn()
vi.mock('../api/api', () => ({ uploadDocument: mockUploadDocument }))

import UploadForm from './UploadForm'

describe('UploadForm', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders file input and upload button', () => {
    render(<UploadForm onUploadComplete={vi.fn()} />)
    expect(screen.getByLabelText(/choose file/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /upload/i })).toBeDisabled()
  })

  it('shows error for invalid file type', async () => {
    render(<UploadForm onUploadComplete={vi.fn()} />)
    const input = screen.getByLabelText(/choose file/i)
    const file = new File(['content'], 'test.txt', { type: 'text/plain' })
    await userEvent.upload(input, file)
    expect(screen.getByText(/only pdf, png, jpg/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /upload/i })).toBeDisabled()
  })

  it('enables upload button for valid file type', async () => {
    render(<UploadForm onUploadComplete={vi.fn()} />)
    const input = screen.getByLabelText(/choose file/i)
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    await userEvent.upload(input, file)
    expect(screen.queryByText(/only pdf, png, jpg/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /upload/i })).not.toBeDisabled()
  })

  it('calls onUploadComplete after successful upload', async () => {
    const mockDoc = { id: '1', fileName: 'test.pdf', status: 'PENDING' }
    mockUploadDocument.mockResolvedValue(mockDoc)
    const onUploadComplete = vi.fn()
    render(<UploadForm onUploadComplete={onUploadComplete} />)
    const input = screen.getByLabelText(/choose file/i)
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    await userEvent.upload(input, file)
    await userEvent.click(screen.getByRole('button', { name: /upload/i }))
    await waitFor(() => expect(onUploadComplete).toHaveBeenCalledWith(mockDoc))
  })

  it('shows error message on upload failure', async () => {
    mockUploadDocument.mockRejectedValue({
      response: { data: { error: 'File too large' } },
    })
    render(<UploadForm onUploadComplete={vi.fn()} />)
    const input = screen.getByLabelText(/choose file/i)
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    await userEvent.upload(input, file)
    await userEvent.click(screen.getByRole('button', { name: /upload/i }))
    await waitFor(() => expect(screen.getByText(/file too large/i)).toBeInTheDocument())
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend && npm test
```

Expected: FAIL — `UploadForm` not found.

- [ ] **Step 3: Implement UploadForm**

Create `frontend/src/components/UploadForm.tsx`:

```tsx
import { useState, useRef } from 'react'
import { uploadDocument } from '../api/api'
import type { DocumentResponse } from '../types/document'

const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']

interface Props {
  onUploadComplete: (doc: DocumentResponse) => void
}

export default function UploadForm({ onUploadComplete }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only PDF, PNG, JPG files are allowed.')
      setSelectedFile(null)
      return
    }
    setError(null)
    setSelectedFile(file)
  }

  async function handleUpload() {
    if (!selectedFile) return
    setLoading(true)
    setError(null)
    try {
      const doc = await uploadDocument(selectedFile)
      onUploadComplete(doc)
      setSelectedFile(null)
      if (inputRef.current) inputRef.current.value = ''
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Upload failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4">Upload Document</h2>
      <label htmlFor="file-input" className="block text-sm font-medium mb-1">
        Choose file
      </label>
      <input
        id="file-input"
        ref={inputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        onChange={handleFileChange}
        className="block w-full text-sm mb-3 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-gray-100 file:text-sm"
      />
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <button
        onClick={handleUpload}
        disabled={!selectedFile || loading}
        className="bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
      >
        {loading ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npm test
```

Expected: 5 tests in UploadForm + 3 in api = 8 total passing.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/UploadForm.tsx frontend/src/components/UploadForm.test.tsx
git commit -m "feat(frontend): add UploadForm component with tests"
```

---

## Task 5: DocumentList component

**Files:**
- Create: `frontend/src/components/DocumentList.tsx`
- Create: `frontend/src/components/DocumentList.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/components/DocumentList.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DocumentList from './DocumentList'
import type { DocumentResponse } from '../types/document'

const makeDoc = (overrides: Partial<DocumentResponse> = {}): DocumentResponse => ({
  id: '1',
  fileName: 'test.pdf',
  fileType: 'application/pdf',
  status: 'COMPLETED',
  summary: 'A test document',
  extractedText: 'hello',
  extractedJson: null,
  createdAt: '2026-05-20T13:00:00',
  ...overrides,
})

describe('DocumentList', () => {
  it('shows empty state when no documents', () => {
    render(<DocumentList documents={[]} selectedId={null} onSelect={vi.fn()} />)
    expect(screen.getByText(/no documents yet/i)).toBeInTheDocument()
  })

  it('renders document file names', () => {
    const docs = [makeDoc({ id: '1', fileName: 'invoice.pdf' }), makeDoc({ id: '2', fileName: 'receipt.png' })]
    render(<DocumentList documents={docs} selectedId={null} onSelect={vi.fn()} />)
    expect(screen.getByText('invoice.pdf')).toBeInTheDocument()
    expect(screen.getByText('receipt.png')).toBeInTheDocument()
  })

  it('renders status badge for each document', () => {
    const docs = [
      makeDoc({ id: '1', status: 'COMPLETED' }),
      makeDoc({ id: '2', status: 'FAILED' }),
    ]
    render(<DocumentList documents={docs} selectedId={null} onSelect={vi.fn()} />)
    expect(screen.getByText('COMPLETED')).toBeInTheDocument()
    expect(screen.getByText('FAILED')).toBeInTheDocument()
  })

  it('calls onSelect when a document is clicked', async () => {
    const doc = makeDoc()
    const onSelect = vi.fn()
    render(<DocumentList documents={[doc]} selectedId={null} onSelect={onSelect} />)
    await userEvent.click(screen.getByText('test.pdf'))
    expect(onSelect).toHaveBeenCalledWith(doc)
  })

  it('highlights the selected document', () => {
    const docs = [makeDoc({ id: '1' }), makeDoc({ id: '2', fileName: 'other.pdf' })]
    const { container } = render(
      <DocumentList documents={docs} selectedId="1" onSelect={vi.fn()} />
    )
    const items = container.querySelectorAll('li')
    expect(items[0].className).toContain('bg-gray-100')
    expect(items[1].className).not.toContain('bg-gray-100')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend && npm test
```

Expected: FAIL — `DocumentList` not found.

- [ ] **Step 3: Implement DocumentList**

Create `frontend/src/components/DocumentList.tsx`:

```tsx
import type { DocumentResponse } from '../types/document'

const STATUS_COLORS: Record<DocumentResponse['status'], string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
}

interface Props {
  documents: DocumentResponse[]
  selectedId: string | null
  onSelect: (doc: DocumentResponse) => void
}

export default function DocumentList({ documents, selectedId, onSelect }: Props) {
  if (documents.length === 0) {
    return <p className="text-gray-400 text-sm">No documents yet.</p>
  }

  return (
    <ul className="divide-y">
      {documents.map((doc) => (
        <li
          key={doc.id}
          onClick={() => onSelect(doc)}
          className={`p-3 cursor-pointer hover:bg-gray-50 ${selectedId === doc.id ? 'bg-gray-100' : ''}`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium truncate">{doc.fileName}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLORS[doc.status]}`}>
              {doc.status}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">{new Date(doc.createdAt).toLocaleString()}</p>
        </li>
      ))}
    </ul>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npm test
```

Expected: 5 DocumentList + 5 UploadForm + 3 api = 13 total passing.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/DocumentList.tsx frontend/src/components/DocumentList.test.tsx
git commit -m "feat(frontend): add DocumentList component with tests"
```

---

## Task 6: DocumentDetail component

**Files:**
- Create: `frontend/src/components/DocumentDetail.tsx`
- Create: `frontend/src/components/DocumentDetail.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/components/DocumentDetail.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import DocumentDetail from './DocumentDetail'
import type { DocumentResponse } from '../types/document'

const makeDoc = (overrides: Partial<DocumentResponse> = {}): DocumentResponse => ({
  id: '1',
  fileName: 'invoice.pdf',
  fileType: 'application/pdf',
  status: 'COMPLETED',
  summary: 'Invoice from ABC Corp for $4400.',
  extractedText: 'Invoice #12345\nTotal Due: $4400.00',
  extractedJson: '{"invoiceNumber":"12345","totalDue":4400}',
  createdAt: '2026-05-20T13:00:00',
  ...overrides,
})

describe('DocumentDetail', () => {
  it('shows empty state when no document selected', () => {
    render(<DocumentDetail document={null} />)
    expect(screen.getByText(/select a document/i)).toBeInTheDocument()
  })

  it('renders file name', () => {
    render(<DocumentDetail document={makeDoc()} />)
    expect(screen.getByText('invoice.pdf')).toBeInTheDocument()
  })

  it('renders summary', () => {
    render(<DocumentDetail document={makeDoc()} />)
    expect(screen.getByText('Invoice from ABC Corp for $4400.')).toBeInTheDocument()
  })

  it('renders extracted text', () => {
    render(<DocumentDetail document={makeDoc()} />)
    expect(screen.getByText(/Invoice #12345/)).toBeInTheDocument()
  })

  it('renders formatted structured JSON', () => {
    render(<DocumentDetail document={makeDoc()} />)
    expect(screen.getByText(/"invoiceNumber": "12345"/)).toBeInTheDocument()
  })

  it('renders failure message when status is FAILED', () => {
    const doc = makeDoc({
      status: 'FAILED',
      summary: 'Analysis failed: timeout',
      extractedText: null,
      extractedJson: null,
    })
    render(<DocumentDetail document={doc} />)
    expect(screen.getByText('Analysis failed: timeout')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend && npm test
```

Expected: FAIL — `DocumentDetail` not found.

- [ ] **Step 3: Implement DocumentDetail**

Create `frontend/src/components/DocumentDetail.tsx`:

```tsx
import type { DocumentResponse } from '../types/document'

interface Props {
  document: DocumentResponse | null
}

export default function DocumentDetail({ document }: Props) {
  if (!document) {
    return <p className="text-gray-400 text-sm">Select a document to view details.</p>
  }

  let parsedJson: object | null = null
  if (document.extractedJson) {
    try {
      parsedJson = JSON.parse(document.extractedJson)
    } catch {
      // ignore — malformed JSON won't crash the UI
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-base">{document.fileName}</h3>

      {document.summary && (
        <section>
          <h4 className="text-sm font-medium text-gray-500 mb-1">Summary</h4>
          <p className="text-sm">{document.summary}</p>
        </section>
      )}

      {document.extractedText && (
        <section>
          <h4 className="text-sm font-medium text-gray-500 mb-1">Extracted Text</h4>
          <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto whitespace-pre-wrap border">
            {document.extractedText}
          </pre>
        </section>
      )}

      {parsedJson && (
        <section>
          <h4 className="text-sm font-medium text-gray-500 mb-1">Structured Data</h4>
          <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto border">
            {JSON.stringify(parsedJson, null, 2)}
          </pre>
        </section>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npm test
```

Expected: 6 DocumentDetail + 5 DocumentList + 5 UploadForm + 3 api = 19 total passing.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/DocumentDetail.tsx frontend/src/components/DocumentDetail.test.tsx
git commit -m "feat(frontend): add DocumentDetail component with tests"
```

---

## Task 7: App.tsx — wire everything together

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/main.tsx`

- [ ] **Step 1: Replace App.tsx**

Replace contents of `frontend/src/App.tsx`:

```tsx
import { useState, useEffect, useCallback } from 'react'
import { getDocuments } from './api/api'
import type { DocumentResponse } from './types/document'
import UploadForm from './components/UploadForm'
import DocumentList from './components/DocumentList'
import DocumentDetail from './components/DocumentDetail'

export default function App() {
  const [documents, setDocuments] = useState<DocumentResponse[]>([])
  const [selectedDocument, setSelectedDocument] = useState<DocumentResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    try {
      const docs = await getDocuments()
      setDocuments(docs)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  function handleUploadComplete(doc: DocumentResponse) {
    fetchDocuments()
    setSelectedDocument(doc)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 shadow-sm">
        <h1 className="text-xl font-bold text-gray-800">AI Document Analyzer</h1>
      </header>
      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <UploadForm onUploadComplete={handleUploadComplete} />
          <div className="bg-white border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">Documents</h2>
            {loading ? (
              <p className="text-gray-400 text-sm">Loading...</p>
            ) : (
              <DocumentList
                documents={documents}
                selectedId={selectedDocument?.id ?? null}
                onSelect={setSelectedDocument}
              />
            )}
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Analysis Result</h2>
          <DocumentDetail document={selectedDocument} />
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Update main.tsx to import CSS**

Replace contents of `frontend/src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 3: Run the full test suite**

```bash
cd frontend && npm test
```

Expected: 19 tests passing.

- [ ] **Step 4: Smoke test the dev UI**

Ensure Docker Compose is running (`docker compose up -d` from repo root), then:

```bash
cd frontend && npm run dev
```

Open http://localhost:5173 in the browser. Verify:
- Page loads with header "AI Document Analyzer"
- Upload form is visible
- Documents panel shows existing documents (or "No documents yet.")
- Upload a PDF and confirm the list refreshes and detail panel shows the result.

Stop dev server with Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/App.tsx frontend/src/main.tsx
git commit -m "feat(frontend): wire App.tsx with upload, document list, and detail"
```

---

## Task 8: Docker integration

**Files:**
- Create: `frontend/Dockerfile`
- Create: `frontend/nginx.conf`
- Create: `frontend/.dockerignore`
- Modify: `docker-compose.yml`

- [ ] **Step 1: Create nginx config**

Create `frontend/nginx.conf`:

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location /api/ {
        proxy_pass http://java-api:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

- [ ] **Step 2: Create Dockerfile**

Create `frontend/Dockerfile`:

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

- [ ] **Step 3: Create .dockerignore**

Create `frontend/.dockerignore`:

```
node_modules
dist
.env
```

- [ ] **Step 4: Add frontend service to docker-compose.yml**

In `docker-compose.yml`, add the frontend service after the `java-api` block:

```yaml
  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      java-api:
        condition: service_started
```

The full `docker-compose.yml` should look like:

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

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      java-api:
        condition: service_started
```

- [ ] **Step 5: Build and verify Docker works**

```bash
docker compose up --build frontend -d
```

Wait ~30 seconds, then open http://localhost:3000. Verify the app loads and API calls work (upload a document).

- [ ] **Step 6: Commit**

```bash
git add frontend/Dockerfile frontend/nginx.conf frontend/.dockerignore docker-compose.yml
git commit -m "feat(frontend): add Dockerfile, nginx proxy config, and docker-compose integration"
```

---

## Task 9: Push to GitHub

- [ ] **Step 1: Push**

```bash
git push origin main
```

Expected: all commits pushed to `https://github.com/zjimmm/ai-document-analyzer`.
