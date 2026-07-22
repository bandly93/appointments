import { type Slot, type Provider, type MyBookingRequest, type PatientInput } from '../types/Booking'

const API_URL = import.meta.env.VITE_API_URL

export async function getProvider(providerId: string): Promise<Provider | undefined> {
  const res = await fetch(`${API_URL}/api/public/providers`)
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Failed to load provider')
  }

  return (data.providers as Provider[]).find((p) => p.id === providerId)
}

export async function getSlots(providerId: string, from: string, to: string): Promise<Slot[]> {
  const res = await fetch(`${API_URL}/api/public/providers/${providerId}/slots?from=${from}&to=${to}`)
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Failed to load availability')
  }

  return data.slots
}

export async function createBookingRequest(input: {
  providerId: string
  startsAt: string
  notes?: string
  patient: PatientInput
}): Promise<{ id: string; accessToken: string }> {
  const res = await fetch(`${API_URL}/api/public/booking-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Failed to submit booking request')
  }

  return { id: data.bookingRequest.id, accessToken: data.accessToken }
}

export async function getMyBooking(id: string, token: string): Promise<MyBookingRequest> {
  const res = await fetch(`${API_URL}/api/public/booking-requests/${id}?token=${encodeURIComponent(token)}`)
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Booking request not found')
  }

  return data.bookingRequest
}

export async function updateMyBooking(id: string, token: string, notes: string): Promise<MyBookingRequest> {
  const res = await fetch(`${API_URL}/api/public/booking-requests/${id}?token=${encodeURIComponent(token)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes }),
  })
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Failed to update booking request')
  }

  return data.bookingRequest
}

export async function cancelMyBooking(id: string, token: string): Promise<MyBookingRequest> {
  const res = await fetch(`${API_URL}/api/public/booking-requests/${id}?token=${encodeURIComponent(token)}`, {
    method: 'DELETE',
  })
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Failed to cancel booking request')
  }

  return data.bookingRequest
}
