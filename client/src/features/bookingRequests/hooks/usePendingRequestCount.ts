import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { getBookingRequests } from '../api/bookingRequestsApi'
import { bookingRequestEvents, BOOKING_REQUESTS_CHANGED } from '../events'

// Live count of requests awaiting approval, scoped to the provider's own
// schedule for providers. Refreshes whenever a request is decided anywhere.
export function usePendingRequestCount(): number {
  const { authFetch, user } = useAuth()
  const [count, setCount] = useState(0)

  const canSeeRequests = user?.role === 'STAFF' || user?.role === 'ADMIN' || user?.role === 'PROVIDER'

  const refresh = useCallback(() => {
    if (!canSeeRequests) return
    getBookingRequests(authFetch, {
      status: 'PENDING',
      providerId: user?.role === 'PROVIDER' ? user.id : undefined,
    })
      .then((requests) => setCount(requests.length))
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSeeRequests, user?.role, user?.id])

  useEffect(() => {
    refresh()
    return bookingRequestEvents.subscribe(BOOKING_REQUESTS_CHANGED, refresh)
  }, [refresh])

  return count
}
