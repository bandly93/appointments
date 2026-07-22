export type Role = 'STAFF' | 'PROVIDER' | 'ADMIN'

export type User = {
  id: string
  email: string
  role: Role
  createdAt: string
}
