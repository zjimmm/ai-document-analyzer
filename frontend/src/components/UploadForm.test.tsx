import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const { mockUploadDocument } = vi.hoisted(() => ({
  mockUploadDocument: vi.fn(),
}))
vi.mock('../api/api', () => ({ uploadDocument: mockUploadDocument }))

import UploadForm from './UploadForm'

describe('UploadForm', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders file input and upload button', () => {
    render(<UploadForm onUploadComplete={vi.fn()} />)
    expect(screen.getByLabelText(/choose file/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /upload/i })).toBeDisabled()
  })

  it('shows error for invalid file type', async () => {
    render(<UploadForm onUploadComplete={vi.fn()} />)
    const input = screen.getByLabelText(/choose file/i)
    const file = new File(['content'], 'test.txt', { type: 'text/plain' })
    await userEvent.upload(input, file)
    expect(screen.getByText(/only pdf, png, jpg/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /upload/i })).toBeDisabled()
  })

  it('enables upload button for valid file type', async () => {
    render(<UploadForm onUploadComplete={vi.fn()} />)
    const input = screen.getByLabelText(/choose file/i)
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    await userEvent.upload(input, file)
    expect(screen.queryByText(/only pdf, png, jpg/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /upload/i })).not.toBeDisabled()
  })

  it('calls onUploadComplete after successful upload', async () => {
    const mockDoc = { id: '1', fileName: 'test.pdf', status: 'PENDING' }
    mockUploadDocument.mockResolvedValue(mockDoc)
    const onUploadComplete = vi.fn()
    render(<UploadForm onUploadComplete={onUploadComplete} />)
    const input = screen.getByLabelText(/choose file/i)
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    await userEvent.upload(input, file)
    await userEvent.click(screen.getByRole('button', { name: /upload/i }))
    await waitFor(() => expect(onUploadComplete).toHaveBeenCalledWith(mockDoc))
  })

  it('shows error message on upload failure', async () => {
    mockUploadDocument.mockRejectedValue({
      response: { data: { error: 'File too large' } },
    })
    render(<UploadForm onUploadComplete={vi.fn()} />)
    const input = screen.getByLabelText(/choose file/i)
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    await userEvent.upload(input, file)
    await userEvent.click(screen.getByRole('button', { name: /upload/i }))
    await waitFor(() => expect(screen.getByText(/file too large/i)).toBeInTheDocument())
  })
})
