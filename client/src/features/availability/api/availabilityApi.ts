import { type AvailabilityRule, type AvailabilityRuleInput } from '../types/AvailabilityRule'

const API_URL = import.meta.env.VITE_API_URL

type AuthFetch = (input: RequestInfo, init?: RequestInit) => Promise<Response>

export async function getMyRules(authFetch: AuthFetch): Promise<AvailabilityRule[]> {
  const res = await authFetch(`${API_URL}/api/availability/mine`)
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Failed to load availability')
  }

  return data.rules
}

export async function createRule(authFetch: AuthFetch, input: AvailabilityRuleInput): Promise<AvailabilityRule> {
  const res = await authFetch(`${API_URL}/api/availability`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Failed to create rule')
  }

  return data.rule
}

export async function deleteRule(authFetch: AuthFetch, id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/api/availability/${id}`, { method: 'DELETE' })

  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Failed to delete rule')
  }
}
