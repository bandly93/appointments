import { type BookingRequest } from '../types/BookingRequest'
import { type PatientInput } from '../../booking/types/Booking'

const API_URL = import.meta.env.VITE_API_URL

type AuthFetch = (input: RequestInfo, init?: RequestInit) => Promise<Response>

export async function getBookingRequests(
  authFetch: AuthFetch,
  filters: { status?: string; providerId?: string } = {},
): Promise<BookingRequest[]> {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.providerId) params.set('providerId', filters.providerId)
  const query = params.toString()
  const res = await authFetch(`${API_URL}/api/booking-requests${query ? `?${query}` : ''}`)
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Failed to load booking requests')
  }

  return data.bookingRequests
}

export async function approveBookingRequest(authFetch: AuthFetch, id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/api/booking-requests/${id}/approve`, { method: 'POST' })

  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Failed to approve booking request')
  }
}

export async function rejectBookingRequest(authFetch: AuthFetch, id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/api/booking-requests/${id}/reject`, { method: 'POST' })

  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Failed to reject booking request')
  }
}

export async function createPhoneBooking(
  authFetch: AuthFetch,
  input: { providerId: string; startsAt: string; notes?: string; patient: PatientInput },
): Promise<{ emailSent: boolean }> {
  const res = await authFetch(`${API_URL}/api/booking-requests/phone`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Failed to create booking')
  }

  return { emailSent: data.emailSent }
}

export async function deleteBookingRequest(authFetch: AuthFetch, id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/api/booking-requests/${id}`, { method: 'DELETE' })

  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Failed to delete booking request')
  }
}
