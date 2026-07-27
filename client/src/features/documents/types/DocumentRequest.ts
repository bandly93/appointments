export type DocumentRequestStatus = 'UNVERIFIED' | 'PENDING' | 'FULFILLED' | 'DECLINED' | 'CANCELLED' | 'EXPIRED'

export type MyDocumentRequest = {
  id: string
  patientId: string
  documentType: string
  message: string | null
  status: DocumentRequestStatus
  createdAt: string
  updatedAt: string
  patient: { id: string; name: string; email: string; phone: string | null }
}

export const DOCUMENT_TYPES = ['Medical records', 'Lab results', 'Referral letter', 'Other'] as const
