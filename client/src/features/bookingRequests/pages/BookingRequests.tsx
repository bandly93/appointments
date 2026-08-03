import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { getBookingRequests, approveBookingRequest, rejectBookingRequest, deleteBookingRequest } from '../api/bookingRequestsApi'
import { type BookingRequest, type BookingStatus } from '../types/BookingRequest'
import { bookingRequestEvents, BOOKING_REQUESTS_CHANGED } from '../events'
import StatusBadge, { STATUS_LABELS } from '../components/StatusBadge'
import StaffBookingModal from '../components/StaffBookingModal'
import ProviderSelect from '../../appointments/components/ProviderSelect'
import Navbar from '../../layout/Navbar'

const STATUSES: BookingStatus[] = ['PENDING', 'UNVERIFIED', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED']

export default function BookingRequests() {
  const { authFetch, user } = useAuth()
  const isProvider = user?.role === 'PROVIDER'
  const canDelete = user?.role === 'STAFF' || user?.role === 'ADMIN'

  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'All'>('PENDING')
  const [providerFilter, setProviderFilter] = useState<string | 'All'>(isProvider && user ? user.id : 'All')
  const [requests, setRequests] = useState<BookingRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [showStaffBooking, setShowStaffBooking] = useState(false)

  const loadRequests = useCallback(async () => {
    setError(null)
    try {
      setRequests(await getBookingRequests(authFetch, {
        status: statusFilter === 'All' ? undefined : statusFilter,
        providerId: providerFilter === 'All' ? undefined : providerFilter,
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load booking requests')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, providerFilter])

  useEffect(() => {
    setLoading(true)
    loadRequests().finally(() => setLoading(false))
  }, [loadRequests])

  function canDecide(request: BookingRequest): boolean {
    if (request.status !== 'PENDING') return false
    if (isProvider) return request.providerId === user?.id
    return true
  }

  async function runAction(id: string, action: () => Promise<void>, failureMessage: string) {
    setActioningId(id)
    setError(null)
    try {
      await action()
      await loadRequests()
      bookingRequestEvents.publish(BOOKING_REQUESTS_CHANGED, { id })
    } catch (err) {
      setError(err instanceof Error ? err.message : failureMessage)
    } finally {
      setActioningId(null)
    }
  }

  function handleDelete(request: BookingRequest) {
    const ok = window.confirm(
      `Delete the request from ${request.patient.name} permanently? This cannot be undone.`,
    )
    if (!ok) return
    void runAction(request.id, () => deleteBookingRequest(authFetch, request.id), 'Failed to delete request')
  }

  return (
    <div className='flex flex-col'>
      <Navbar />
      <div className='w-full max-w-6xl mx-auto p-6'>
        <div className='flex flex-wrap items-center justify-between gap-3 mb-4'>
          <h1 className='text-2xl font-semibold text-gray-900'>Booking requests ({requests.length})</h1>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={() => setShowStaffBooking(true)}
              className='rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500'
            >
              New booking
            </button>
            <ProviderSelect value={providerFilter} onChange={setProviderFilter} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as BookingStatus | 'All')}
              className='rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>{STATUS_LABELS[status]}</option>
              ))}
              <option value='All'>All statuses</option>
            </select>
          </div>
        </div>

        {error && (
          <div className='mb-4 rounded-md bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm'>
            {error}
          </div>
        )}

        {loading
          ? <div className='py-10 text-center text-gray-500'>Loading....</div>
          : (
            <div className='overflow-x-auto rounded-lg border border-gray-200 shadow-sm'>
              <div className='grid grid-cols-[1.1fr_1fr_1.2fr_280px] bg-gray-50'>
                <div className='px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500'>Patient</div>
                <div className='px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500'>Provider</div>
                <div className='px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500'>When</div>
                <div className='px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500'>Status</div>
              </div>
              <div className='divide-y divide-gray-200'>
              {requests.length !== 0
                ? requests.map((r) => (
                  <div key={r.id} className='grid grid-cols-[1.1fr_1fr_1.2fr_280px] items-start hover:bg-gray-50/70 transition-colors'>
                    <div className='px-4 py-3.5 text-sm text-gray-900'>
                      {r.patient.name}
                      <div className='text-xs text-gray-500'>{r.patient.email}</div>
                      {r.patient.phone && <div className='text-xs text-gray-500'>{r.patient.phone}</div>}
                    </div>
                    <div className='px-4 py-3.5 text-sm text-gray-700'>{r.provider.displayName ?? 'Provider'}</div>
                    <div className='px-4 py-3.5 text-sm text-gray-700'>
                      {new Date(r.startsAt).toLocaleString(undefined, {
                        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
                      })}
                      {r.notes && (
                        <div className='text-xs text-gray-500 italic truncate' title={r.notes}>
                          “{r.notes}”
                        </div>
                      )}
                    </div>
                    <div className='px-4 py-3.5 text-sm flex flex-col items-start gap-2'>
                      <StatusBadge status={r.status} />
                      {(canDecide(r) || canDelete) && (
                        <div className='flex flex-wrap items-center gap-2'>
                          {canDecide(r) && (
                            <>
                              <button
                                type='button'
                                disabled={actioningId === r.id}
                                onClick={() => void runAction(r.id, () => approveBookingRequest(authFetch, r.id), 'Failed to approve request')}
                                className='rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-green-500 disabled:opacity-50'
                              >
                                Approve
                              </button>
                              <button
                                type='button'
                                disabled={actioningId === r.id}
                                onClick={() => void runAction(r.id, () => rejectBookingRequest(authFetch, r.id), 'Failed to decline request')}
                                className='rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50'
                              >
                                Decline
                              </button>
                            </>
                          )}
                          {canDelete && (
                            <button
                              type='button'
                              disabled={actioningId === r.id}
                              onClick={() => handleDelete(r)}
                              className='text-sm text-red-600 hover:text-red-800 disabled:opacity-50'
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
                : (
                  <div className='px-4 py-10 text-center text-gray-500'>
                    {statusFilter === 'PENDING' ? 'No requests waiting for approval' : 'No booking requests'}
                  </div>
                )
              }
              </div>
            </div>
          )
        }

        {showStaffBooking && (
          <StaffBookingModal
            onClose={() => setShowStaffBooking(false)}
            onBooked={() => {
              setShowStaffBooking(false)
              void loadRequests()
              bookingRequestEvents.publish(BOOKING_REQUESTS_CHANGED, {})
            }}
          />
        )}
      </div>
    </div>
  )
}
