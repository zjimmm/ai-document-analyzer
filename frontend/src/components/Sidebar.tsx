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
