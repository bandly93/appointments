type TokenGetter = () => string | null
type Refresher = () => Promise<string | null>

// refresh() must never reject - it's expected to catch its own errors and
// resolve null on failure so the retry path below stays simple. It must also
// be safe to call concurrently (single-flighted by the caller), since the
// underlying refresh token is single-use and rotated on every call.
export function createAuthFetch(getToken: TokenGetter, refresh: Refresher) {
  return async function authFetch(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
    const withAuth = (token: string | null): RequestInit => ({
      ...init,
      credentials: 'include',
      headers: {
        ...(init.headers ?? {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

    let res = await fetch(input, withAuth(getToken()))

    if (res.status === 401) {
      const newToken = await refresh()
      if (newToken) {
        res = await fetch(input, withAuth(newToken))
      }
    }

    return res
  }
}
