import { type Patient, type PatientDetail, type PatientUpdate } from '../types/Patient'

const API_URL = import.meta.env.VITE_API_URL

type AuthFetch = (input: RequestInfo, init?: RequestInit) => Promise<Response>

export async function getPatients(authFetch: AuthFetch, search?: string): Promise<Patient[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : ''
  const res = await authFetch(`${API_URL}/api/patients${query}`)
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Failed to load patients')
  }

  return data.patients
}

export async function getPatient(authFetch: AuthFetch, id: string): Promise<PatientDetail> {
  const res = await authFetch(`${API_URL}/api/patients/${id}`)
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Failed to load patient')
  }

  return data.patient
}

export async function updatePatient(authFetch: AuthFetch, id: string, update: PatientUpdate): Promise<Patient> {
  const res = await authFetch(`${API_URL}/api/patients/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update),
  })
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Failed to update patient')
  }

  return data.patient
}
