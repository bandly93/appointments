export type Role = 'STAFF' | 'PROVIDER' | 'ADMIN'

export type AdminUser = {
  id: string
  email: string
  role: Role
  createdAt: string
}
