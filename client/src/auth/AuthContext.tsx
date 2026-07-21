import { createContext, useContext, useState, type ReactNode } from 'react'

type User = {
  id: string
  email: string
  role: string
}

type LoginResponse = {
  success: boolean
  accessToken: string
  user: User
}

type AuthContextValue = {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const API_URL = import.meta.env.VITE_API_URL

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  async function login(email: string, password: string) {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || 'Login failed')
    }

    const { accessToken, user } = data as LoginResponse
    setAccessToken(accessToken)
    setUser(user)
  }

  function logout() {
    setAccessToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, accessToken, isAuthenticated: accessToken !== null, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
