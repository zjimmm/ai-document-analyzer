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
