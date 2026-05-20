import { useState, useRef } from 'react'
import { uploadDocument } from '../api/api'
import type { DocumentResponse } from '../types/document'

const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg']

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
