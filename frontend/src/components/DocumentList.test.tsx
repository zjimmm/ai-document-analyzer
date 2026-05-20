import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DocumentList from './DocumentList'
import type { DocumentResponse } from '../types/document'

const makeDoc = (overrides: Partial<DocumentResponse> = {}): DocumentResponse => ({
  id: '1',
  fileName: 'test.pdf',
  fileType: 'application/pdf',
  status: 'COMPLETED',
  summary: 'A test document',
  extractedText: 'hello',
  extractedJson: null,
  createdAt: '2026-05-20T13:00:00',
  ...overrides,
})

describe('DocumentList', () => {
  it('shows empty state when no documents', () => {
    render(<DocumentList documents={[]} selectedId={null} onSelect={vi.fn()} />)
    expect(screen.getByText(/no documents yet/i)).toBeInTheDocument()
  })

  it('renders document file names', () => {
    const docs = [makeDoc({ id: '1', fileName: 'invoice.pdf' }), makeDoc({ id: '2', fileName: 'receipt.png' })]
    render(<DocumentList documents={docs} selectedId={null} onSelect={vi.fn()} />)
    expect(screen.getByText('invoice.pdf')).toBeInTheDocument()
    expect(screen.getByText('receipt.png')).toBeInTheDocument()
  })

  it('renders status badge for each document', () => {
    const docs = [
      makeDoc({ id: '1', status: 'COMPLETED' }),
      makeDoc({ id: '2', status: 'FAILED' }),
    ]
    render(<DocumentList documents={docs} selectedId={null} onSelect={vi.fn()} />)
    expect(screen.getByText('COMPLETED')).toBeInTheDocument()
    expect(screen.getByText('FAILED')).toBeInTheDocument()
  })

  it('calls onSelect when a document is clicked', async () => {
    const doc = makeDoc()
    const onSelect = vi.fn()
    render(<DocumentList documents={[doc]} selectedId={null} onSelect={onSelect} />)
    await userEvent.click(screen.getByText('test.pdf'))
    expect(onSelect).toHaveBeenCalledWith(doc)
  })

  it('highlights the selected document', () => {
    const docs = [makeDoc({ id: '1' }), makeDoc({ id: '2', fileName: 'other.pdf' })]
    const { container } = render(
      <DocumentList documents={docs} selectedId="1" onSelect={vi.fn()} />
    )
    const items = container.querySelectorAll('li')
    expect(items[0].className).toContain('bg-gray-100')
    expect(items[1].className).not.toContain('bg-gray-100')
  })
})
