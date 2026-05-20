import axios from 'axios'
import type { DocumentResponse } from '../types/document'

const client = axios.create()

export async function uploadDocument(file: File): Promise<DocumentResponse> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await client.post<DocumentResponse>('/api/documents', formData)
  return data
}

export async function getDocuments(): Promise<DocumentResponse[]> {
  const { data } = await client.get<DocumentResponse[]>('/api/documents')
  return data
}

export async function getDocument(id: string): Promise<DocumentResponse> {
  const { data } = await client.get<DocumentResponse>(`/api/documents/${id}`)
  return data
}
