import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { DocumentResponse } from '../types/document'

const { mockUploadDocument } = vi.hoisted(() => ({
  mockUploadDocument: vi.fn(),
}))
vi.mock('../api/api', () => ({ uploadDocument: mockUploadDocument }))

import Sidebar from './Sidebar'

const mockDoc: DocumentResponse = {
  id: '1', fileName: 'test.pdf', fileType: 'application/pdf',
  status: 'COMPLETED', summary: null, extractedText: null,
  extractedJson: null, createdAt: '2026-05-21T00:00:00Z',
}

const defaultProps = {
  documents: [],
  selectedId: null,
  onSelect: vi.fn(),
  onUploadComplete: vi.fn(),
  loading: false,
  fetchError: null,
}

describe('Sidebar', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders app title', () => {
    render(<Sidebar {...defaultProps} />)
    expect(screen.getByText('AI Document Analyzer')).toBeInTheDocument()
  })

  it('renders upload zone', () => {
    render(<Sidebar {...defaultProps} />)
    expect(screen.getByText(/drop file here or click to browse/i)).toBeInTheDocument()
  })

  it('shows error for invalid file type', async () => {
    render(<Sidebar {...defaultProps} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['content'], 'doc.txt', { type: 'text/plain' })
    await userEvent.upload(input, file)
    expect(await screen.findByText(/only pdf, png, jpg/i)).toBeInTheDocument()
  })

  it('uploads valid file and calls onUploadComplete', async () => {
    mockUploadDocument.mockResolvedValue(mockDoc)
    const onUploadComplete = vi.fn()
    render(<Sidebar {...defaultProps} onUploadComplete={onUploadComplete} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' })
    await userEvent.upload(input, file)
    await waitFor(() => expect(onUploadComplete).toHaveBeenCalledWith(mockDoc))
  })

  it('shows upload error message on failure', async () => {
    mockUploadDocument.mockRejectedValue({ response: { data: { error: 'Server error' } } })
    render(<Sidebar {...defaultProps} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' })
    await userEvent.upload(input, file)
    expect(await screen.findByText('Server error')).toBeInTheDocument()
  })

  it('shows 3 skeleton rows when loading', () => {
    render(<Sidebar {...defaultProps} loading={true} />)
    expect(document.querySelectorAll('.animate-pulse').length).toBe(3)
  })

  it('shows fetchError when provided', () => {
    render(<Sidebar {...defaultProps} fetchError="Failed to load documents." />)
    expect(screen.getByText('Failed to load documents.')).toBeInTheDocument()
  })

  it('highlights drag-over state', () => {
    render(<Sidebar {...defaultProps} />)
    const zone = screen.getByText(/drop file here/i).closest('div') as HTMLElement
    fireEvent.dragOver(zone)
    expect(zone.className).toContain('border-indigo-400')
  })
})
