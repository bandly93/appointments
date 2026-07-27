import { type Appointment } from '../types/Appointment'

const API_URL = import.meta.env.VITE_API_URL

type AuthFetch = (input: RequestInfo, init?: RequestInit) => Promise<Response>

export async function getAppointments(
  authFetch: AuthFetch,
  filters: { date?: string; from?: string; to?: string; status?: Appointment['status']; providerId?: string } = {}
): Promise<Appointment[]> {
  const params = new URLSearchParams()
  if (filters.date) params.set('date', filters.date)
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  if (filters.status) params.set('status', filters.status)
  if (filters.providerId) params.set('providerId', filters.providerId)
  const query = params.toString()

  const res = await authFetch(`${API_URL}/api/appointments${query ? `?${query}` : ''}`)
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Failed to load appointments')
  }

  return data.appointments
}

export async function updateAppointmentStatus(
  authFetch: AuthFetch,
  id: string,
  status: Appointment['status']
): Promise<Appointment> {
  const res = await authFetch(`${API_URL}/api/appointments/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Failed to update appointment')
  }

  return data.appointment
}
