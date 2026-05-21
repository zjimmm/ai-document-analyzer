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
