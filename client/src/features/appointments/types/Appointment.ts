export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'

export type Appointment = {
  id: string
  providerId: string
  patientId: string
  bookingRequestId: string | null
  startsAt: string
  endsAt: string
  status: AppointmentStatus
  notes: string | null
  createdAt: string
  updatedAt: string
  provider: { id: string; displayName: string | null }
  patient: { id: string; name: string; email: string; phone: string | null }
}
