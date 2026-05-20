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
