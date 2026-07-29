import { type PatientDocument } from '../types/PatientDocument'

const API_URL = import.meta.env.VITE_API_URL

type AuthFetch = (input: RequestInfo, init?: RequestInit) => Promise<Response>

export async function getPatientDocuments(authFetch: AuthFetch, patientId: string): Promise<PatientDocument[]> {
  const res = await authFetch(`${API_URL}/api/patients/${patientId}/documents`)
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Failed to load documents')
  }

  return data.documents
}

export async function uploadPatientDocument(
  authFetch: AuthFetch,
  patientId: string,
  file: File,
  documentType: string,
  visibleToPatient: boolean
): Promise<PatientDocument> {
  const body = new FormData()
  body.set('file', file)
  body.set('documentType', documentType)
  body.set('visibleToPatient', String(visibleToPatient))

  // Omit Content-Type — the browser sets the multipart boundary itself.
  const res = await authFetch(`${API_URL}/api/patients/${patientId}/documents`, { method: 'POST', body })
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Failed to upload document')
  }

  return data.document
}

// <a href> can't carry an Authorization header, so the file is fetched as a
// blob and "downloaded" via a throwaway object URL instead of linking directly.
export async function downloadPatientDocument(authFetch: AuthFetch, id: string, filename: string): Promise<void> {
  const res = await authFetch(`${API_URL}/api/patients/documents/${id}/file`)
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
