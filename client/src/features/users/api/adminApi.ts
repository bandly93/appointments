import { type User, type Role } from '../types/User'

const API_URL = import.meta.env.VITE_API_URL

type AuthFetch = (input: RequestInfo, init?: RequestInit) => Promise<Response>

export async function getUsers(authFetch: AuthFetch): Promise<User[]> {
  const res = await authFetch(`${API_URL}/api/admin/users`)
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Failed to load users')
  }

  return data.users
}

export async function createUser(
  authFetch: AuthFetch,
  input: { email: string, password: string, role: Role }
): Promise<User> {
  const res = await authFetch(`${API_URL}/api/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Failed to create user')
  }

  return data.user
}
