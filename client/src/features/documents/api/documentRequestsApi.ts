import { type MyDocumentRequest } from '../types/DocumentRequest'

const API_URL = import.meta.env.VITE_API_URL

type AuthFetch = (input: RequestInfo, init?: RequestInit) => Promise<Response>

export async function getDocumentRequests(authFetch: AuthFetch, status?: string): Promise<MyDocumentRequest[]> {
  const url = status ? `${API_URL}/api/document-requests?status=${status}` : `${API_URL}/api/document-requests`
  const res = await authFetch(url)
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Failed to load document requests')
  }

  return data.documentRequests
}

export async function fulfillDocumentRequest(authFetch: AuthFetch, id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/api/document-requests/${id}/fulfill`, { method: 'POST' })

  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Failed to fulfill document request')
  }
}

export async function declineDocumentRequest(authFetch: AuthFetch, id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/api/document-requests/${id}/decline`, { method: 'POST' })

  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Failed to decline document request')
  }
}
