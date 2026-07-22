export type BookingStatus = 'UNVERIFIED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED'

export type BookingRequest = {
  id: string
  providerId: string
  patientId: string
  startsAt: string
  endsAt: string
  status: BookingStatus
  notes: string | null
  createdAt: string
  updatedAt: string
  provider: { id: string; displayName: string | null }
  patient: { id: string; name: string; email: string; phone: string | null }
}
