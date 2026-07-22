import { type BookingRequest } from '../types/BookingRequest'

const API_URL = import.meta.env.VITE_API_URL

type AuthFetch = (input: RequestInfo, init?: RequestInit) => Promise<Response>

export async function getBookingRequests(authFetch: AuthFetch, status?: string): Promise<BookingRequest[]> {
  const url = status ? `${API_URL}/api/booking-requests?status=${status}` : `${API_URL}/api/booking-requests`
  const res = await authFetch(url)
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

export async function deleteBookingRequest(authFetch: AuthFetch, id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/api/booking-requests/${id}`, { method: 'DELETE' })

  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Failed to delete booking request')
  }
}
