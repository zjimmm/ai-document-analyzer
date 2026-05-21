import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

vi.mock('./api/api', () => ({
  getDocuments: vi.fn(),
  uploadDocument: vi.fn(),
}))

import App from './App'
import { getDocuments } from './api/api'

const mockGetDocuments = vi.mocked(getDocuments)

describe('App', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows loading state initially', () => {
    mockGetDocuments.mockReturnValue(new Promise(() => {}))
    render(<App />)
    expect(document.querySelectorAll('.animate-pulse').length).toBe(3)
  })

  it('renders document list after fetch', async () => {
    mockGetDocuments.mockResolvedValue([
      { id: '1', fileName: 'invoice.pdf', fileType: 'application/pdf', status: 'COMPLETED', summary: 'Test', extractedText: null, extractedJson: null, createdAt: '2026-05-20T13:00:00' },
    ])
    render(<App />)
    await waitFor(() => expect(screen.getByText('invoice.pdf')).toBeInTheDocument())
  })

  it('shows error when fetch fails', async () => {
    mockGetDocuments.mockRejectedValue(new Error('network error'))
    render(<App />)
    await waitFor(() => expect(screen.getByText(/failed to load documents/i)).toBeInTheDocument())
  })
})
