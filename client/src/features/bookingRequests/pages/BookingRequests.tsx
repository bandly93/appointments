import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { getBookingRequests, approveBookingRequest, rejectBookingRequest, deleteBookingRequest } from '../api/bookingRequestsApi'
import { type BookingRequest, type BookingStatus } from '../types/BookingRequest'
import Navbar from '../../layout/Navbar'

const STATUSES: (BookingStatus | 'All')[] = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'All']

export default function BookingRequests() {
  const { authFetch } = useAuth()
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'All'>('PENDING')
  const [requests, setRequests] = useState<BookingRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actioningId, setActioningId] = useState<string | null>(null)

  const loadRequests = async () => {
    setLoading(true)
    setError(null)
    try {
      setRequests(await getBookingRequests(authFetch, statusFilter === 'All' ? undefined : statusFilter))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load booking requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  async function handleApprove(id: string) {
    setActioningId(id)
    setError(null)
    try {
      await approveBookingRequest(authFetch, id)
      setRequests((current) => current.filter((r) => r.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve request')
    } finally {
      setActioningId(null)
    }
  }

  async function handleReject(id: string) {
    setActioningId(id)
    setError(null)
    try {
      await rejectBookingRequest(authFetch, id)
      setRequests((current) => current.filter((r) => r.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject request')
    } finally {
      setActioningId(null)
    }
  }

  async function handleDelete(id: string) {
    setActioningId(id)
    setError(null)
    try {
      await deleteBookingRequest(authFetch, id)
      setRequests((current) => current.filter((r) => r.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete request')
    } finally {
      setActioningId(null)
    }
  }

  return (
    <div className='flex flex-col'>
      <Navbar />
      <div className='w-full max-w-5xl mx-auto p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h1 className='text-2xl font-semibold text-gray-900'>Booking requests ({requests.length})</h1>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as BookingStatus | 'All')}
            className='rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
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
              <div className='grid grid-cols-[1fr_1fr_1fr_100px_220px] bg-gray-50'>
                <div className='px-4 py-3 text-sm font-semibold text-gray-700'>Patient</div>
                <div className='px-4 py-3 text-sm font-semibold text-gray-700'>Provider</div>
                <div className='px-4 py-3 text-sm font-semibold text-gray-700'>When</div>
                <div className='px-4 py-3 text-sm font-semibold text-gray-700'>Status</div>
                <div className='px-4 py-3 text-sm font-semibold text-gray-700'></div>
              </div>
              {requests.length !== 0
                ? requests.map((r) => (
                  <div key={r.id} className='grid grid-cols-[1fr_1fr_1fr_100px_220px] border-t border-gray-200'>
                    <div className='px-4 py-3 text-sm text-gray-900'>
                      {r.patient.name}
                      <div className='text-xs text-gray-500'>{r.patient.email}</div>
                    </div>
                    <div className='px-4 py-3 text-sm text-gray-700'>{r.provider.displayName ?? 'Provider'}</div>
                    <div className='px-4 py-3 text-sm text-gray-700'>
                      {new Date(r.startsAt).toLocaleString()}
                    </div>
                    <div className='px-4 py-3 text-sm text-gray-700'>{r.status}</div>
                    <div className='px-4 py-3 text-sm flex gap-3'>
                      {r.status === 'PENDING' && (
                        <>
                          <button
                            type='button'
                            disabled={actioningId === r.id}
                            onClick={() => handleApprove(r.id)}
                            className='text-green-700 hover:text-green-900 disabled:opacity-50'
                          >
                            Approve
                          </button>
                          <button
                            type='button'
                            disabled={actioningId === r.id}
                            onClick={() => handleReject(r.id)}
                            className='text-amber-700 hover:text-amber-900 disabled:opacity-50'
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        type='button'
                        disabled={actioningId === r.id}
                        onClick={() => handleDelete(r.id)}
                        className='text-red-600 hover:text-red-800 disabled:opacity-50'
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
                : (
                  <div className='px-4 py-10 text-center text-gray-500'>
                    No booking requests
                  </div>
                )
              }
            </div>
          )
        }
      </div>
    </div>
  )
}
