import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { createAuthFetch } from './apiClient'

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

type RefreshResponse = {
  success: boolean
  accessToken: string
  user: User
}

type AuthContextValue = {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  authFetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const API_URL = import.meta.env.VITE_API_URL

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const tokenRef = useRef<string | null>(null)
  tokenRef.current = accessToken

  // The refresh token is single-use (rotated server-side on every call), so
  // any two calls in flight at once would race over the same token and one
  // would spuriously fail. This guard collapses concurrent callers - e.g.
  // React StrictMode double-invoking the mount effect below, or a 401 retry
  // landing while the mount-time refresh is still pending - into one request.
  const refreshInFlightRef = useRef<Promise<string | null> | null>(null)

  const refresh = useCallback((): Promise<string | null> => {
    if (refreshInFlightRef.current) {
      return refreshInFlightRef.current
    }

    const promise = (async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        })

        if (!res.ok) {
          setAccessToken(null)
          setUser(null)
          return null
        }

        const data = (await res.json()) as RefreshResponse
        setAccessToken(data.accessToken)
        setUser(data.user)
        return data.accessToken
      } catch {
        setAccessToken(null)
        setUser(null)
        return null
      } finally {
        refreshInFlightRef.current = null
      }
    })()

    refreshInFlightRef.current = promise
    return promise
  }, [])

  const authFetchRef = useRef(createAuthFetch(() => tokenRef.current, refresh))

  useEffect(() => {
    refresh().finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  async function logout() {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } finally {
      setAccessToken(null)
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: accessToken !== null,
        isLoading,
        login,
        logout,
        authFetch: authFetchRef.current,
      }}
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
