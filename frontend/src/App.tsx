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
    <div className="flex h-screen bg-slate-950">
      <Sidebar
        documents={documents}
        selectedId={selectedDocument?.id ?? null}
        onSelect={setSelectedDocument}
        onUploadComplete={handleUploadComplete}
        loading={loading}
        fetchError={fetchError}
      />
      <main className="flex-1 overflow-y-auto p-6">
        <DocumentDetail document={selectedDocument} />
      </main>
    </div>
  )
}
