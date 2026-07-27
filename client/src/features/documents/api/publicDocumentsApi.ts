import { type MyDocumentRequest } from '../types/DocumentRequest'

const API_URL = import.meta.env.VITE_API_URL

export async function requestDocuments(input: {
  email: string
  documentType: string
  message?: string
}): Promise<{ emailSent: boolean }> {
  const res = await fetch(`${API_URL}/api/public/document-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Failed to submit document request')
  }

  return { emailSent: data.emailSent }
}

export async function getMyDocumentRequest(id: string, token: string): Promise<MyDocumentRequest> {
  const res = await fetch(`${API_URL}/api/public/document-requests/${id}?token=${encodeURIComponent(token)}`)
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Document request not found')
  }

  return data.documentRequest
}

export async function verifyDocumentRequest(id: string, token: string, code: string): Promise<MyDocumentRequest> {
  const res = await fetch(`${API_URL}/api/public/document-requests/${id}/verify?token=${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Failed to verify code')
  }

  return data.documentRequest
}

export async function resendDocumentRequestCode(id: string, token: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/public/document-requests/${id}/resend-code?token=${encodeURIComponent(token)}`, {
    method: 'POST',
  })

  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Failed to resend code')
  }
}

export async function cancelMyDocumentRequest(id: string, token: string): Promise<MyDocumentRequest> {
  const res = await fetch(`${API_URL}/api/public/document-requests/${id}?token=${encodeURIComponent(token)}`, {
    method: 'DELETE',
  })
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Failed to cancel document request')
  }

  return data.documentRequest
}
