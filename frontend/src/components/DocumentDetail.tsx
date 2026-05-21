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
