export type Slot = {
  startsAt: string
  endsAt: string
}

export type Provider = {
  id: string
  displayName: string | null
}

export type BookingStatus = 'UNVERIFIED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED'

export type MyBookingRequest = {
  id: string
  startsAt: string
  endsAt: string
  status: BookingStatus
  notes: string | null
  provider: { id: string; displayName: string | null }
  patient: { id: string; name: string; email: string; phone: string | null }
}

export type PatientInput = {
  name: string
  email: string
  phone?: string
}
