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
