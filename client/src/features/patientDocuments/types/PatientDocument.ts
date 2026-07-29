export type PatientDocument = {
  id: string
  patientId: string
  documentType: string
  uploadedByRole: string
  uploadedByUser: { id: string; email: string; displayName: string | null } | null
  visibleToPatient: boolean
  fileOriginalName: string
  fileMimeType: string
  fileSizeBytes: number
  createdAt: string
}

export const PATIENT_DOCUMENT_TYPES = [
  "Driver's license",
  'Insurance card',
  'ID document',
  'Medical records',
  'Lab results',
  'Other',
] as const
