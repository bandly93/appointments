import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { getDocumentRequests, fulfillDocumentRequest, declineDocumentRequest } from '../api/documentRequestsApi'
import { type MyDocumentRequest, type DocumentRequestStatus } from '../types/DocumentRequest'
import { documentRequestEvents, DOCUMENT_REQUESTS_CHANGED } from '../events'
import StatusBadge, { STATUS_LABELS } from '../components/StatusBadge'
import Navbar from '../../layout/Navbar'

const STATUSES: DocumentRequestStatus[] = ['PENDING', 'UNVERIFIED', 'FULFILLED', 'DECLINED', 'CANCELLED', 'EXPIRED']

export default function DocumentRequests() {
  const { authFetch } = useAuth()
  const [statusFilter, setStatusFilter] = useState<DocumentRequestStatus | 'All'>('PENDING')
  const [requests, setRequests] = useState<MyDocumentRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actioningId, setActioningId] = useState<string | null>(null)

  const loadRequests = async () => {
    setLoading(true)
    setError(null)
    try {
      setRequests(await getDocumentRequests(authFetch, statusFilter === 'All' ? undefined : statusFilter))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  async function runAction(id: string, action: () => Promise<void>, failureMessage: string) {
    setActioningId(id)
    setError(null)
    try {
      await action()
      setRequests((current) => current.filter((r) => r.id !== id))
      documentRequestEvents.publish(DOCUMENT_REQUESTS_CHANGED, { id })
    } catch (err) {
      setError(err instanceof Error ? err.message : failureMessage)
    } finally {
      setActioningId(null)
    }
  }

  return (
    <div className='flex flex-col'>
      <Navbar />
      <div className='w-full max-w-5xl mx-auto p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h1 className='text-2xl font-semibold text-gray-900'>Document requests ({requests.length})</h1>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as DocumentRequestStatus | 'All')}
            className='rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>{STATUS_LABELS[status]}</option>
            ))}
            <option value='All'>All statuses</option>
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
              <div className='grid grid-cols-[1.2fr_1fr_1.4fr_170px_180px] bg-gray-50'>
                <div className='px-4 py-3 text-sm font-semibold text-gray-700'>Patient</div>
                <div className='px-4 py-3 text-sm font-semibold text-gray-700'>Document</div>
                <div className='px-4 py-3 text-sm font-semibold text-gray-700'>Message</div>
                <div className='px-4 py-3 text-sm font-semibold text-gray-700'>Status</div>
                <div className='px-4 py-3 text-sm font-semibold text-gray-700'></div>
              </div>
              {requests.length !== 0
                ? requests.map((r) => (
                  <div key={r.id} className='grid grid-cols-[1.2fr_1fr_1.4fr_170px_180px] border-t border-gray-200 items-center'>
                    <div className='px-4 py-3 text-sm text-gray-900'>
                      {r.patient.name}
                      <div className='text-xs text-gray-500'>{r.patient.email}</div>
                      {r.patient.phone && <div className='text-xs text-gray-500'>{r.patient.phone}</div>}
                    </div>
                    <div className='px-4 py-3 text-sm text-gray-700'>{r.documentType}</div>
                    <div className='px-4 py-3 text-sm text-gray-700'>
                      {r.message
                        ? <span className='italic truncate block' title={r.message}>“{r.message}”</span>
                        : <span className='text-gray-400'>—</span>
                      }
                    </div>
                    <div className='px-4 py-3 text-sm'>
                      <StatusBadge status={r.status} />
                    </div>
                    <div className='px-4 py-3 text-sm flex gap-3'>
                      {r.status === 'PENDING' && (
                        <>
                          <button
                            type='button'
                            disabled={actioningId === r.id}
                            onClick={() => void runAction(r.id, () => fulfillDocumentRequest(authFetch, r.id), 'Failed to fulfill request')}
                            className='text-green-700 hover:text-green-900 disabled:opacity-50'
                          >
                            Fulfill
                          </button>
                          <button
                            type='button'
                            disabled={actioningId === r.id}
                            onClick={() => void runAction(r.id, () => declineDocumentRequest(authFetch, r.id), 'Failed to decline request')}
                            className='text-red-600 hover:text-red-800 disabled:opacity-50'
                          >
                            Decline
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
                : (
                  <div className='px-4 py-10 text-center text-gray-500'>
                    {statusFilter === 'PENDING' ? 'No requests waiting for fulfillment' : 'No document requests'}
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
