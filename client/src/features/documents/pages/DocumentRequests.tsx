import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import {
  getDocumentRequests,
  fulfillDocumentRequest,
  declineDocumentRequest,
  downloadDocumentRequestFile,
} from '../api/documentRequestsApi'
import { type MyDocumentRequest, type DocumentRequestStatus } from '../types/DocumentRequest'
import { documentRequestEvents, DOCUMENT_REQUESTS_CHANGED } from '../events'
import StatusBadge, { STATUS_LABELS } from '../components/StatusBadge'
import Navbar from '../../layout/Navbar'
import { formatFileSize } from '../../../shared/lib/formatFileSize'
import DownloadIcon from '../../../shared/components/DownloadIcon'

const STATUSES: DocumentRequestStatus[] = ['PENDING', 'UNVERIFIED', 'FULFILLED', 'DECLINED', 'CANCELLED', 'EXPIRED']

export default function DocumentRequests() {
  const { authFetch } = useAuth()
  const [statusFilter, setStatusFilter] = useState<DocumentRequestStatus | 'All'>('PENDING')
  const [requests, setRequests] = useState<MyDocumentRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [pendingFiles, setPendingFiles] = useState<Record<string, File>>({})
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

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
      setPendingFiles((current) => {
        const { [id]: _removed, ...rest } = current
        return rest
      })
      documentRequestEvents.publish(DOCUMENT_REQUESTS_CHANGED, { id })
    } catch (err) {
      setError(err instanceof Error ? err.message : failureMessage)
    } finally {
      setActioningId(null)
    }
  }

  async function handleDownload(r: MyDocumentRequest) {
    setError(null)
    try {
      await downloadDocumentRequestFile(authFetch, r.id, r.fileOriginalName ?? 'document')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download file')
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
              <div className='grid grid-cols-[1.1fr_1fr_1.1fr_320px] bg-gray-50'>
                <div className='px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500'>Patient</div>
                <div className='px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500'>Document</div>
                <div className='px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500'>Message</div>
                <div className='px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500'>Status</div>
              </div>
              <div className='divide-y divide-gray-200'>
              {requests.length !== 0
                ? requests.map((r) => (
                  <div key={r.id} className='grid grid-cols-[1.1fr_1fr_1.1fr_320px] items-start hover:bg-gray-50/70 transition-colors'>
                    <div className='px-4 py-3.5 text-sm text-gray-900'>
                      {r.patient.name}
                      <div className='text-xs text-gray-500'>{r.patient.email}</div>
                      {r.patient.phone && <div className='text-xs text-gray-500'>{r.patient.phone}</div>}
                    </div>
                    <div className='px-4 py-3.5 text-sm text-gray-700'>{r.documentType}</div>
                    <div className='px-4 py-3.5 text-sm text-gray-700'>
                      {r.message
                        ? <span className='italic truncate block' title={r.message}>“{r.message}”</span>
                        : <span className='text-gray-400'>—</span>
                      }
                    </div>
                    <div className='px-4 py-3.5 text-sm flex flex-col items-start gap-2'>
                      <StatusBadge status={r.status} />

                      {r.status === 'PENDING' && (
                        <div className='flex flex-col gap-2 w-full'>
                          <div className='flex items-center gap-2'>
                            <input
                              ref={(el) => { fileInputRefs.current[r.id] = el }}
                              type='file'
                              accept='.pdf,.png,.jpg,.jpeg,.doc,.docx'
                              className='hidden'
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) setPendingFiles((current) => ({ ...current, [r.id]: file }))
                              }}
                            />
                            <button
                              type='button'
                              onClick={() => fileInputRefs.current[r.id]?.click()}
                              className='rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50'
                            >
                              {pendingFiles[r.id] ? 'Change file' : 'Attach file'}
                            </button>
                            {pendingFiles[r.id] && (
                              <span className='text-xs text-gray-500 truncate max-w-[140px]' title={pendingFiles[r.id].name}>
                                {pendingFiles[r.id].name}
                              </span>
                            )}
                          </div>
                          <div className='flex flex-wrap items-center gap-2'>
                            <button
                              type='button'
                              disabled={actioningId === r.id}
                              onClick={() => void runAction(
                                r.id,
                                () => fulfillDocumentRequest(authFetch, r.id, pendingFiles[r.id]),
                                'Failed to fulfill request',
                              )}
                              className='rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-green-500 disabled:opacity-50'
                            >
                              Fulfill
                            </button>
                            <button
                              type='button'
                              disabled={actioningId === r.id}
                              onClick={() => void runAction(r.id, () => declineDocumentRequest(authFetch, r.id), 'Failed to decline request')}
                              className='rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50'
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      )}

                      {r.status === 'FULFILLED' && r.fileOriginalName && (
                        <button
                          type='button'
                          onClick={() => void handleDownload(r)}
                          className='inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800'
                        >
                          <DownloadIcon />
                          <span className='truncate max-w-[160px]'>{r.fileOriginalName}</span>
                          {r.fileSizeBytes !== null && (
                            <span className='text-gray-400 font-normal'>({formatFileSize(r.fileSizeBytes)})</span>
                          )}
                        </button>
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
            </div>
          )
        }
      </div>
    </div>
  )
}
