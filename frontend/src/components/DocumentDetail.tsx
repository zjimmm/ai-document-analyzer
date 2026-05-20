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

      {document.status === 'FAILED' && document.summary && (
        <section>
          <h4 className="text-sm font-medium text-red-500 mb-1">Analysis Failed</h4>
          <p className="text-sm text-red-600">{document.summary}</p>
        </section>
      )}
      {document.status !== 'FAILED' && document.summary && (
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
