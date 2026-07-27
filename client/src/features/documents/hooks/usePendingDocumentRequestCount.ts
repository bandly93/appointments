import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { getDocumentRequests } from '../api/documentRequestsApi'
import { documentRequestEvents, DOCUMENT_REQUESTS_CHANGED } from '../events'

export function usePendingDocumentRequestCount(): number {
  const { authFetch, user } = useAuth()
  const [count, setCount] = useState(0)
  const canSeeRequests = user?.role === 'STAFF' || user?.role === 'ADMIN'

  const refresh = useCallback(() => {
    if (!canSeeRequests) return
    getDocumentRequests(authFetch, 'PENDING')
      .then((requests) => setCount(requests.length))
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSeeRequests])

  useEffect(() => {
    refresh()
    return documentRequestEvents.subscribe(DOCUMENT_REQUESTS_CHANGED, refresh)
  }, [refresh])

  return count
}
