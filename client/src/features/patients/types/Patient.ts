import { type AppointmentStatus } from '../../appointments/types/Appointment'
import { type DocumentRequestStatus } from '../../documents/types/DocumentRequest'

export type Patient = {
  id: string
  email: string
  name: string
  phone: string | null
  dateOfBirth: string | null
  address: string | null
  createdAt: string
  updatedAt: string
}

export type PatientAppointment = {
  id: string
  startsAt: string
  endsAt: string
  status: AppointmentStatus
  notes: string | null
  provider: { id: string; displayName: string | null }
}

export type PatientDocumentRequest = {
  id: string
  documentType: string
  message: string | null
  status: DocumentRequestStatus
  createdAt: string
  fileOriginalName: string | null
}

export type PatientDetail = Patient & {
  appointments: PatientAppointment[]
  documentRequests: PatientDocumentRequest[]
}

export type PatientUpdate = Partial<{
  name: string
  phone: string | null
  dateOfBirth: string | null
  address: string | null
}>
