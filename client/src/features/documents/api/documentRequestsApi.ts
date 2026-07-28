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

export async function fulfillDocumentRequest(authFetch: AuthFetch, id: string, file?: File): Promise<void> {
  let body: FormData | undefined
  if (file) {
    body = new FormData()
    body.set('file', file)
  }

  // Omit Content-Type entirely when sending FormData — the browser sets the
  // multipart boundary itself, and setting it manually breaks the upload.
  const res = await authFetch(`${API_URL}/api/document-requests/${id}/fulfill`, { method: 'POST', body })

  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Failed to fulfill document request')
  }
}

// <a href> can't carry an Authorization header, so the file is fetched as a
// blob and "downloaded" via a throwaway object URL instead of linking directly.
export async function downloadDocumentRequestFile(authFetch: AuthFetch, id: string, filename: string): Promise<void> {
  const res = await authFetch(`${API_URL}/api/document-requests/${id}/file`)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Failed to download file')
  }

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export async function declineDocumentRequest(authFetch: AuthFetch, id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/api/document-requests/${id}/decline`, { method: 'POST' })

  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Failed to decline document request')
  }
}
