# Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the React frontend from a basic two-column layout into a professional dark-sidebar SaaS aesthetic (Linear/Notion style) while preserving all existing functionality.

**Architecture:** Replace the two-column grid with a fixed dark sidebar (`Sidebar.tsx`) containing the upload zone and document list, and a light main area showing the tabbed `DocumentDetail`. `UploadForm.tsx` is deleted — its logic moves into `Sidebar.tsx`. All API calls and state management in `App.tsx` remain unchanged.

**Tech Stack:** React 18 + TypeScript, Tailwind CSS v4, Inter font (Google Fonts), Vitest + React Testing Library

---

## File Map

| File | Change |
|------|--------|
| `frontend/src/index.css` | Add Inter font import and set as default sans font |
| `frontend/src/App.tsx` | Rewrite layout — sidebar + main split, pass new props to Sidebar |
| `frontend/src/components/Sidebar.tsx` | **New** — dark sidebar with upload zone, drag-and-drop, document list |
| `frontend/src/components/Sidebar.test.tsx` | **New** — replaces UploadForm.test.tsx |
| `frontend/src/components/DocumentList.tsx` | Styling update — dark sidebar aesthetic, dot status badges |
| `frontend/src/components/DocumentList.test.tsx` | Update status badge text assertions (COMPLETED→Done, FAILED→Failed, etc.) |
| `frontend/src/components/DocumentDetail.tsx` | Rewrite — tabbed layout (Summary / Extracted Text / Structured Data) |
| `frontend/src/components/DocumentDetail.test.tsx` | Update for tabbed layout — click tab then assert content |
| `frontend/src/components/UploadForm.tsx` | **Deleted** |
| `frontend/src/components/UploadForm.test.tsx` | **Deleted** |
| `frontend/src/App.test.tsx` | Update for new layout — loading uses skeleton not "Loading..." text |

---

## Task 1: Add Inter font

**Files:**
- Modify: `frontend/src/index.css`

No tests needed — pure CSS change.

- [ ] **Step 1: Update index.css**

Replace the entire contents of `frontend/src/index.css` with:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
@import "tailwindcss";

@theme {
  --font-family-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
}
```

- [ ] **Step 2: Verify dev server still starts**

```bash
cd frontend && npm run dev
```

Expected: Vite starts with no errors. Open `http://localhost:5173` — font should visibly change to Inter.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/index.css
git commit -m "feat(frontend): add Inter font"
```

---

## Task 2: Update DocumentList styling

**Files:**
- Modify: `frontend/src/components/DocumentList.tsx`
- Modify: `frontend/src/components/DocumentList.test.tsx`

Status badge labels changed: `COMPLETED` → `Done`, `PENDING` → `Pending`, `PROCESSING` → `Processing`, `FAILED` → `Failed`. Tests must be updated first.

- [ ] **Step 1: Update the status badge assertions in the test**

Replace the entire contents of `frontend/src/components/DocumentList.test.tsx` with:

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

  it('renders status label for each document', () => {
    const docs = [
      makeDoc({ id: '1', status: 'COMPLETED' }),
      makeDoc({ id: '2', status: 'FAILED' }),
    ]
    render(<DocumentList documents={docs} selectedId={null} onSelect={vi.fn()} />)
    expect(screen.getByText('Done')).toBeInTheDocument()
    expect(screen.getByText('Failed')).toBeInTheDocument()
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
    expect(items[0].className).toContain('bg-slate-800')
    expect(items[1].className).not.toContain('bg-slate-800')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend && npm test -- DocumentList
```

Expected: FAIL — `'Done'` not found (still shows `'COMPLETED'`), and selected item doesn't have `bg-slate-800`.

- [ ] **Step 3: Rewrite DocumentList.tsx**

Replace the entire contents of `frontend/src/components/DocumentList.tsx` with:

```tsx
import type { DocumentResponse } from '../types/document'

const STATUS_CONFIG: Record<DocumentResponse['status'], { dot: string; text: string; label: string }> = {
  PENDING:    { dot: 'bg-yellow-400', text: 'text-yellow-300', label: 'Pending' },
  PROCESSING: { dot: 'bg-blue-400',   text: 'text-blue-300',   label: 'Processing' },
  COMPLETED:  { dot: 'bg-green-400',  text: 'text-green-300',  label: 'Done' },
  FAILED:     { dot: 'bg-red-400',    text: 'text-red-300',    label: 'Failed' },
}

interface Props {
  documents: DocumentResponse[]
  selectedId: string | null
  onSelect: (doc: DocumentResponse) => void
}

export default function DocumentList({ documents, selectedId, onSelect }: Props) {
  if (documents.length === 0) {
    return <p className="px-4 text-xs text-slate-500">No documents yet. Upload one to get started.</p>
  }

  return (
    <ul>
      {documents.map((doc) => {
        const status = STATUS_CONFIG[doc.status]
        const isSelected = selectedId === doc.id
        return (
          <li
            key={doc.id}
            onClick={() => onSelect(doc)}
            className={`px-4 py-3 cursor-pointer border-l-2 transition-colors ${
              isSelected
                ? 'bg-slate-800 border-indigo-400'
                : 'border-transparent hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-white truncate">{doc.fileName}</span>
              <span className={`flex items-center gap-1 text-xs shrink-0 ${status.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${status.dot}`} />
                {status.label}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {new Date(doc.createdAt).toLocaleString()}
            </p>
          </li>
        )
      })}
    </ul>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npm test -- DocumentList
```

Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/DocumentList.tsx frontend/src/components/DocumentList.test.tsx
git commit -m "feat(frontend): update DocumentList with dark sidebar styling"
```

---

## Task 3: Create Sidebar component

**Files:**
- Create: `frontend/src/components/Sidebar.tsx`
- Create: `frontend/src/components/Sidebar.test.tsx`
- Delete: `frontend/src/components/UploadForm.tsx`
- Delete: `frontend/src/components/UploadForm.test.tsx`

`Sidebar` absorbs the upload logic from `UploadForm`. Write tests first.

- [ ] **Step 1: Create Sidebar.test.tsx**

Create `frontend/src/components/Sidebar.test.tsx` with:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { DocumentResponse } from '../types/document'

const { mockUploadDocument } = vi.hoisted(() => ({
  mockUploadDocument: vi.fn(),
}))
vi.mock('../api/api', () => ({ uploadDocument: mockUploadDocument }))

import Sidebar from './Sidebar'

const mockDoc: DocumentResponse = {
  id: '1', fileName: 'test.pdf', fileType: 'application/pdf',
  status: 'COMPLETED', summary: null, extractedText: null,
  extractedJson: null, createdAt: '2026-05-21T00:00:00Z',
}

const defaultProps = {
  documents: [],
  selectedId: null,
  onSelect: vi.fn(),
  onUploadComplete: vi.fn(),
  loading: false,
  fetchError: null,
}

describe('Sidebar', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders app title', () => {
    render(<Sidebar {...defaultProps} />)
    expect(screen.getByText('AI Document Analyzer')).toBeInTheDocument()
  })

  it('renders upload zone', () => {
    render(<Sidebar {...defaultProps} />)
    expect(screen.getByText(/drop file here or click to browse/i)).toBeInTheDocument()
  })

  it('shows error for invalid file type', async () => {
    render(<Sidebar {...defaultProps} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['content'], 'doc.txt', { type: 'text/plain' })
    await userEvent.upload(input, file)
    expect(await screen.findByText(/only pdf, png, jpg/i)).toBeInTheDocument()
  })

  it('uploads valid file and calls onUploadComplete', async () => {
    mockUploadDocument.mockResolvedValue(mockDoc)
    const onUploadComplete = vi.fn()
    render(<Sidebar {...defaultProps} onUploadComplete={onUploadComplete} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' })
    await userEvent.upload(input, file)
    await waitFor(() => expect(onUploadComplete).toHaveBeenCalledWith(mockDoc))
  })

  it('shows upload error message on failure', async () => {
    mockUploadDocument.mockRejectedValue({ response: { data: { error: 'Server error' } } })
    render(<Sidebar {...defaultProps} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' })
    await userEvent.upload(input, file)
    expect(await screen.findByText('Server error')).toBeInTheDocument()
  })

  it('shows 3 skeleton rows when loading', () => {
    render(<Sidebar {...defaultProps} loading={true} />)
    expect(document.querySelectorAll('.animate-pulse').length).toBe(3)
  })

  it('shows fetchError when provided', () => {
    render(<Sidebar {...defaultProps} fetchError="Failed to load documents." />)
    expect(screen.getByText('Failed to load documents.')).toBeInTheDocument()
  })

  it('highlights drag-over state', () => {
    render(<Sidebar {...defaultProps} />)
    const zone = screen.getByText(/drop file here/i).closest('div') as HTMLElement
    fireEvent.dragOver(zone)
    expect(zone.className).toContain('border-indigo-400')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend && npm test -- Sidebar
```

Expected: FAIL — `Cannot find module './Sidebar'`.

- [ ] **Step 3: Create Sidebar.tsx**

Create `frontend/src/components/Sidebar.tsx` with:

```tsx
import { useState, useRef } from 'react'
import { uploadDocument } from '../api/api'
import type { DocumentResponse } from '../types/document'
import DocumentList from './DocumentList'

interface Props {
  documents: DocumentResponse[]
  selectedId: string | null
  onSelect: (doc: DocumentResponse) => void
  onUploadComplete: (doc: DocumentResponse) => void
  loading: boolean
  fetchError: string | null
}

const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg']

export default function Sidebar({ documents, selectedId, onSelect, onUploadComplete, loading, fetchError }: Props) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('Only PDF, PNG, JPG files are allowed.')
      return
    }
    setUploadError(null)
    setUploading(true)
    try {
      const doc = await uploadDocument(file)
      onUploadComplete(doc)
    } catch (err: any) {
      setUploadError(err.response?.data?.error ?? 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(true)
  }

  function handleDragLeave() {
    setDragOver(false)
  }

  return (
    <aside className="w-72 h-screen bg-slate-900 flex flex-col shrink-0 border-r border-slate-700">
      {/* Header */}
      <div className="px-4 py-5 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-lg">📄</span>
          <span className="text-sm font-semibold text-white">AI Document Analyzer</span>
        </div>
      </div>

      {/* Upload zone */}
      <div className="px-4 py-4 border-b border-slate-700">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-indigo-400 bg-slate-800'
              : 'border-slate-600 hover:border-slate-500'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />
          <p className="text-sm text-slate-400">
            {uploading ? 'Uploading…' : 'Drop file here or click to browse'}
          </p>
          <p className="text-xs text-slate-500 mt-1">PDF, PNG, JPG</p>
        </div>
        {uploadError && <p className="text-xs text-red-400 mt-2">{uploadError}</p>}
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Documents</h2>
        </div>
        {loading ? (
          <div className="px-4 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-800 rounded animate-pulse" />
            ))}
          </div>
        ) : fetchError ? (
          <p className="px-4 text-xs text-red-400">{fetchError}</p>
        ) : (
          <DocumentList documents={documents} selectedId={selectedId} onSelect={onSelect} />
        )}
      </div>
    </aside>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npm test -- Sidebar
```

Expected: All 8 tests PASS.

- [ ] **Step 5: Delete UploadForm files**

```bash
rm frontend/src/components/UploadForm.tsx
rm frontend/src/components/UploadForm.test.tsx
```

- [ ] **Step 6: Run full test suite to make sure nothing broke**

```bash
cd frontend && npm test
```

Expected: All tests PASS (UploadForm tests gone, Sidebar tests green).

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/Sidebar.tsx frontend/src/components/Sidebar.test.tsx
git rm frontend/src/components/UploadForm.tsx frontend/src/components/UploadForm.test.tsx
git commit -m "feat(frontend): add Sidebar with upload zone, remove UploadForm"
```

---

## Task 4: Update DocumentDetail with tabbed layout

**Files:**
- Modify: `frontend/src/components/DocumentDetail.tsx`
- Modify: `frontend/src/components/DocumentDetail.test.tsx`

The detail panel gains three tabs (Summary, Extracted Text, Structured Data) and status-aware states for PENDING/PROCESSING/FAILED. Update tests first.

- [ ] **Step 1: Rewrite DocumentDetail.test.tsx**

Replace the entire contents of `frontend/src/components/DocumentDetail.test.tsx` with:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

  it('renders file name for completed document', () => {
    render(<DocumentDetail document={makeDoc()} />)
    expect(screen.getByText('invoice.pdf')).toBeInTheDocument()
  })

  it('shows summary tab by default for COMPLETED document', () => {
    render(<DocumentDetail document={makeDoc()} />)
    expect(screen.getByText('Invoice from ABC Corp for $4400.')).toBeInTheDocument()
  })

  it('switches to extracted text tab', async () => {
    render(<DocumentDetail document={makeDoc()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Extracted Text' }))
    expect(screen.getByText(/Invoice #12345/)).toBeInTheDocument()
  })

  it('switches to structured data tab and formats JSON', async () => {
    render(<DocumentDetail document={makeDoc()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Structured Data' }))
    expect(screen.getByText(/"invoiceNumber": "12345"/)).toBeInTheDocument()
  })

  it('shows Analysis Failed for FAILED document', () => {
    render(<DocumentDetail document={makeDoc({ status: 'FAILED', summary: 'Timed out.' })} />)
    expect(screen.getByText('Analysis Failed')).toBeInTheDocument()
    expect(screen.getByText('Timed out.')).toBeInTheDocument()
  })

  it('shows in-progress state for PROCESSING document', () => {
    render(<DocumentDetail document={makeDoc({ status: 'PROCESSING' })} />)
    expect(screen.getByText(/analysis in progress/i)).toBeInTheDocument()
  })

  it('shows in-progress state for PENDING document', () => {
    render(<DocumentDetail document={makeDoc({ status: 'PENDING' })} />)
    expect(screen.getByText(/analysis in progress/i)).toBeInTheDocument()
  })

  it('does not crash for malformed extractedJson', async () => {
    render(<DocumentDetail document={makeDoc({ extractedJson: '{ bad json' })} />)
    await userEvent.click(screen.getByRole('button', { name: 'Structured Data' }))
    expect(screen.getByText(/no structured data/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend && npm test -- DocumentDetail
```

Expected: FAIL — tabs don't exist yet, `'Analysis Failed'` text differs, `'analysis in progress'` missing.

- [ ] **Step 3: Rewrite DocumentDetail.tsx**

Replace the entire contents of `frontend/src/components/DocumentDetail.tsx` with:

```tsx
import { useState } from 'react'
import type { DocumentResponse } from '../types/document'

type Tab = 'summary' | 'text' | 'json'

interface Props {
  document: DocumentResponse | null
}

export default function DocumentDetail({ document }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('summary')

  if (!document) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <span className="text-5xl mb-4">📂</span>
        <p className="text-slate-500 text-sm">Select a document from the sidebar to view its analysis</p>
      </div>
    )
  }

  if (document.status === 'FAILED') {
    return (
      <div className="p-6">
        <h3 className="text-base font-semibold text-slate-800 mb-4">{document.fileName}</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-700 mb-1">Analysis Failed</h4>
          <p className="text-sm text-red-600">{document.summary ?? 'An unknown error occurred.'}</p>
        </div>
      </div>
    )
  }

  if (document.status === 'PENDING' || document.status === 'PROCESSING') {
    return (
      <div className="p-6">
        <h3 className="text-base font-semibold text-slate-800 mb-4">{document.fileName}</h3>
        <div className="flex items-center gap-2 text-slate-500">
          <svg className="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span className="text-sm">Analysis in progress…</span>
        </div>
      </div>
    )
  }

  let parsedJson: object | null = null
  if (document.extractedJson) {
    try {
      parsedJson = JSON.parse(document.extractedJson)
    } catch {
      // ignore malformed JSON
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'summary', label: 'Summary' },
    { id: 'text', label: 'Extracted Text' },
    { id: 'json', label: 'Structured Data' },
  ]

  return (
    <div className="p-6">
      <h3 className="text-base font-semibold text-slate-800 mb-4">{document.fileName}</h3>

      <div className="border-b border-slate-200 mb-4">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-sm pb-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600 font-medium'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'summary' && (
        <p className="text-sm text-slate-700 leading-relaxed">
          {document.summary ?? <span className="text-slate-400">No summary available.</span>}
        </p>
      )}

      {activeTab === 'text' && (
        <pre className="text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg p-4 overflow-auto max-h-96 whitespace-pre-wrap">
          {document.extractedText ?? <span className="text-slate-400">No extracted text.</span>}
        </pre>
      )}

      {activeTab === 'json' && (
        parsedJson
          ? <pre className="text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg p-4 overflow-auto max-h-96">{JSON.stringify(parsedJson, null, 2)}</pre>
          : <p className="text-sm text-slate-400">No structured data available.</p>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npm test -- DocumentDetail
```

Expected: All 9 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/DocumentDetail.tsx frontend/src/components/DocumentDetail.test.tsx
git commit -m "feat(frontend): tabbed DocumentDetail with status-aware states"
```

---

## Task 5: Rewire App.tsx to use Sidebar

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/App.test.tsx`

Replace the two-column layout with `<Sidebar>` + `<main>`. Update App tests since loading now shows skeleton rows (not "Loading..." text).

- [ ] **Step 1: Update App.test.tsx**

Replace the entire contents of `frontend/src/App.test.tsx` with:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

vi.mock('./api/api', () => ({
  getDocuments: vi.fn(),
  uploadDocument: vi.fn(),
}))

import App from './App'
import { getDocuments } from './api/api'

const mockGetDocuments = vi.mocked(getDocuments)

describe('App', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders sidebar and empty state initially', async () => {
    mockGetDocuments.mockResolvedValue([])
    render(<App />)
    expect(screen.getByText('AI Document Analyzer')).toBeInTheDocument()
    expect(await screen.findByText(/select a document/i)).toBeInTheDocument()
  })

  it('renders document list after fetch', async () => {
    mockGetDocuments.mockResolvedValue([
      { id: '1', fileName: 'invoice.pdf', fileType: 'application/pdf', status: 'COMPLETED', summary: 'Test', extractedText: null, extractedJson: null, createdAt: '2026-05-20T13:00:00' },
    ])
    render(<App />)
    await waitFor(() => expect(screen.getByText('invoice.pdf')).toBeInTheDocument())
  })

  it('shows error when fetch fails', async () => {
    mockGetDocuments.mockRejectedValue(new Error('network error'))
    render(<App />)
    await waitFor(() => expect(screen.getByText(/failed to load documents/i)).toBeInTheDocument())
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend && npm test -- App.test
```

Expected: FAIL — `'AI Document Analyzer'` not found (still using old layout with `<UploadForm />`).

- [ ] **Step 3: Rewrite App.tsx**

Replace the entire contents of `frontend/src/App.tsx` with:

```tsx
import { useState, useEffect, useCallback } from 'react'
import { getDocuments } from './api/api'
import type { DocumentResponse } from './types/document'
import Sidebar from './components/Sidebar'
import DocumentDetail from './components/DocumentDetail'

export default function App() {
  const [documents, setDocuments] = useState<DocumentResponse[]>([])
  const [selectedDocument, setSelectedDocument] = useState<DocumentResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const docs = await getDocuments()
      setDocuments(docs)
    } catch {
      setFetchError('Failed to load documents.')
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
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar
        documents={documents}
        selectedId={selectedDocument?.id ?? null}
        onSelect={setSelectedDocument}
        onUploadComplete={handleUploadComplete}
        loading={loading}
        fetchError={fetchError}
      />
      <main className="flex-1 overflow-y-auto">
        <DocumentDetail document={selectedDocument} />
      </main>
    </div>
  )
}
```

- [ ] **Step 4: Run full test suite**

```bash
cd frontend && npm test
```

Expected: All tests PASS. No references to UploadForm remain.

- [ ] **Step 5: Run TypeScript check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 6: Verify UI in browser**

```bash
cd frontend && npm run dev
```

Open `http://localhost:5173`. Verify:
- Dark sidebar on the left with app title, upload zone, document list
- Light main area on the right with empty state
- Upload a PDF — it appears in the sidebar list
- Click a document — detail panel shows tabs (Summary / Extracted Text / Structured Data)
- Drag a file onto the upload zone — it uploads correctly

- [ ] **Step 7: Commit and push**

```bash
git add frontend/src/App.tsx frontend/src/App.test.tsx
git commit -m "feat(frontend): rewire App to use Sidebar layout"
git push origin main
```
