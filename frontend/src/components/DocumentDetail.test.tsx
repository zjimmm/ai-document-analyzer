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
