import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockPost, mockGet } = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockGet: vi.fn(),
}))

vi.mock('axios', () => ({
  default: {
    create: () => ({ post: mockPost, get: mockGet }),
  },
}))

import { uploadDocument, getDocuments, getDocument } from './api'

describe('api', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uploadDocument posts to /api/documents with FormData', async () => {
    const mockDoc = { id: '1', fileName: 'test.pdf', status: 'PENDING' }
    mockPost.mockResolvedValue({ data: mockDoc })
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    const result = await uploadDocument(file)
    expect(mockPost).toHaveBeenCalledWith('/api/documents', expect.any(FormData))
    expect(result).toEqual(mockDoc)
  })

  it('getDocuments fetches from /api/documents', async () => {
    const mockDocs = [{ id: '1', fileName: 'test.pdf', status: 'COMPLETED' }]
    mockGet.mockResolvedValue({ data: mockDocs })
    const result = await getDocuments()
    expect(mockGet).toHaveBeenCalledWith('/api/documents')
    expect(result).toEqual(mockDocs)
  })

  it('getDocument fetches from /api/documents/:id', async () => {
    const mockDoc = { id: '123', fileName: 'test.pdf', status: 'COMPLETED' }
    mockGet.mockResolvedValue({ data: mockDoc })
    const result = await getDocument('123')
    expect(mockGet).toHaveBeenCalledWith('/api/documents/123')
    expect(result).toEqual(mockDoc)
  })
})
