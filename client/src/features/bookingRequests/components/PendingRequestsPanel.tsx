import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { getBookingRequests, approveBookingRequest, rejectBookingRequest } from '../api/bookingRequestsApi'
import { type BookingRequest } from '../types/BookingRequest'
import { bookingRequestEvents, BOOKING_REQUESTS_CHANGED } from '../events'

// Dashboard inbox: pending requests the signed-in user can act on right away.
// Providers see their own queue; staff/admin see everyone's.
export default function PendingRequestsPanel() {
  const { authFetch, user } = useAuth()
  const isProvider = user?.role === 'PROVIDER'

  const [requests, setRequests] = useState<BookingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actioningId, setActioningId] = useState<string | null>(null)

  useEffect(() => {
    getBookingRequests(authFetch, { status: 'PENDING', providerId: isProvider ? user?.id : undefined })
      .then(setRequests)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load pending requests'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleDecision(id: string, decision: 'approve' | 'decline') {
    setActioningId(id)
    setError(null)
    try {
      if (decision === 'approve') {
        await approveBookingRequest(authFetch, id)
      } else {
        await rejectBookingRequest(authFetch, id)
      }
      setRequests((current) => current.filter((r) => r.id !== id))
      bookingRequestEvents.publish(BOOKING_REQUESTS_CHANGED, { id, decision })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update request')
    } finally {
      setActioningId(null)
    }
  }

  if (loading || (requests.length === 0 && !error)) return null

  return (
    <div className='mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4'>
      <div className='flex items-center justify-between mb-3'>
        <h2 className='text-sm font-semibold text-amber-900'>
          {requests.length} booking request{requests.length === 1 ? '' : 's'} awaiting approval
        </h2>
        <Link to='/booking-requests' className='text-sm font-medium text-amber-800 hover:text-amber-900 underline'>
          View all
        </Link>
      </div>

      {error && (
        <div className='mb-3 rounded-md bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm'>
          {error}
        </div>
      )}

      <ul className='flex flex-col gap-2'>
        {requests.map((r) => (
          <li
            key={r.id}
            className='flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border border-amber-100 bg-white px-4 py-3'
          >
            <div className='min-w-0 flex-1'>
              <div className='text-sm font-medium text-gray-900'>
                {r.patient.name}
                {!isProvider && (
                  <span className='font-normal text-gray-500'> · {r.provider.displayName ?? 'Provider'}</span>
                )}
              </div>
              <div className='text-xs text-gray-500'>
                {new Date(r.startsAt).toLocaleString(undefined, {
                  weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                })}
                {r.notes && <span className='italic'> — “{r.notes}”</span>}
              </div>
            </div>
            <div className='flex gap-2'>
              <button
                type='button'
                disabled={actioningId === r.id}
                onClick={() => handleDecision(r.id, 'approve')}
                className='rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-green-500 disabled:opacity-50'
              >
                Approve
              </button>
              <button
                type='button'
                disabled={actioningId === r.id}
                onClick={() => handleDecision(r.id, 'decline')}
                className='rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50'
              >
                Decline
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
