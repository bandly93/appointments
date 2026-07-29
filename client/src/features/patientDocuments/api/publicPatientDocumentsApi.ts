import { type PatientDocument } from '../types/PatientDocument'

const API_URL = import.meta.env.VITE_API_URL

export async function getMyDocuments(bookingRequestId: string, token: string): Promise<PatientDocument[]> {
  const res = await fetch(`${API_URL}/api/public/booking-requests/${bookingRequestId}/documents?token=${encodeURIComponent(token)}`)
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Failed to load documents')
  }

  return data.documents
}

export async function uploadMyDocument(
  bookingRequestId: string,
  token: string,
  file: File,
  documentType: string
): Promise<PatientDocument> {
  const body = new FormData()
  body.set('file', file)
  body.set('documentType', documentType)

  const res = await fetch(
    `${API_URL}/api/public/booking-requests/${bookingRequestId}/documents?token=${encodeURIComponent(token)}`,
    { method: 'POST', body }
  )
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Failed to upload document')
  }

  return data.document
}

// Token travels as a query param, so a plain link works for downloads.
export function getMyDocumentFileUrl(bookingRequestId: string, docId: string, token: string): string {
  return `${API_URL}/api/public/booking-requests/${bookingRequestId}/documents/${docId}/file?token=${encodeURIComponent(token)}`
}
