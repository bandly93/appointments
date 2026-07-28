import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { getMyDocumentRequest, cancelMyDocumentRequest, verifyDocumentRequest, getMyDocumentFileUrl } from '../api/publicDocumentsApi'
import { type MyDocumentRequest } from '../types/DocumentRequest'
import VerifyDocumentCodeForm from '../components/VerifyDocumentCodeForm'
import PublicHeader from '../../../shared/components/PublicHeader'

const STATUS_LABELS: Record<MyDocumentRequest['status'], string> = {
  UNVERIFIED: 'Awaiting email confirmation',
  PENDING: 'Sent to our team',
  FULFILLED: 'Fulfilled',
  DECLINED: 'Declined',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
}

export default function MyDocumentsPage() {
  const { requestId } = useParams<{ requestId: string }>()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const autoVerifyCode = searchParams.get('code') ?? ''

  const [request, setRequest] = useState<MyDocumentRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isAutoVerifying, setIsAutoVerifying] = useState(false)
  const [justConfirmed, setJustConfirmed] = useState(false)
  const autoVerifyAttempted = useRef(false)

  useEffect(() => {
    if (!requestId || !token) {
      setLoading(false)
      setError('This link is missing required information')
      return
    }

    getMyDocumentRequest(requestId, token)
      .then(async (r) => {
        if (r.status === 'UNVERIFIED' && autoVerifyCode.length === 6 && !autoVerifyAttempted.current) {
          autoVerifyAttempted.current = true
          setIsAutoVerifying(true)
          try {
            r = await verifyDocumentRequest(requestId, token, autoVerifyCode)
            setJustConfirmed(true)
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to verify code')
          } finally {
            setIsAutoVerifying(false)
          }
        }
        setRequest(r)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Document request not found'))
      .finally(() => setLoading(false))
  }, [requestId, token, autoVerifyCode])

  async function handleCancel() {
    if (!requestId) return
    setIsSaving(true)
    setError(null)
    try {
      const updated = await cancelMyDocumentRequest(requestId, token)
      setRequest(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel document request')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <PublicHeader />
        <div className='p-10 text-center text-gray-500'>
          {isAutoVerifying ? 'Confirming your request…' : 'Loading....'}
        </div>
      </div>
    )
  }

  if (error && !request) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <PublicHeader />
        <div className='w-full max-w-xl mx-auto p-6'>
          <div className='rounded-md bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm'>{error}</div>
        </div>
      </div>
    )
  }

  if (!request) return null

  return (
    <div className='min-h-screen bg-gray-50'>
      <PublicHeader />
      <div className='w-full max-w-xl mx-auto p-6'>
        <h1 className='text-2xl font-semibold text-gray-900 mb-1'>Your document request</h1>
        <p className='text-sm text-gray-500 mb-4'>{request.documentType}</p>

        {justConfirmed && request.status === 'PENDING' && (
          <div className='mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800'>
            ✓ Email confirmed. Your request has been sent to our team — we'll be in touch once it's ready.
          </div>
        )}

        <div className='rounded-lg border border-gray-200 bg-white shadow-sm p-4 mb-4'>
          <div className='text-sm text-gray-700 mb-1'>{request.documentType}</div>
          {request.message && <div className='text-sm text-gray-500 italic mb-1'>“{request.message}”</div>}
          <div className='text-sm font-medium text-gray-900'>Status: {STATUS_LABELS[request.status]}</div>

          {request.status === 'FULFILLED' && request.fileOriginalName && (
            <a
              href={getMyDocumentFileUrl(request.id, token)}
              className='mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800'
            >
              <svg viewBox='0 0 20 20' fill='none' className='h-4 w-4 shrink-0'>
                <path
                  d='M10 3v9m0 0-3.5-3.5M10 12l3.5-3.5M4 14.5v.5a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-.5'
                  stroke='currentColor'
                  strokeWidth='1.5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
              Download {request.fileOriginalName}
            </a>
          )}
        </div>

        {error && (
          <div className='mb-4 rounded-md bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm'>
            {error}
          </div>
        )}

        {request.status === 'UNVERIFIED' && (
          <div className='mb-4'>
            <VerifyDocumentCodeForm
              requestId={request.id}
              token={token}
              onVerified={(updated) => setRequest(updated)}
            />
          </div>
        )}

        {request.status === 'EXPIRED' && (
          <p className='text-sm text-gray-500'>
            This request expired before the email was confirmed. Please submit a new request.
          </p>
        )}

        {(request.status === 'UNVERIFIED' || request.status === 'PENDING') && (
          <div className='flex justify-end'>
            <button
              type='button'
              disabled={isSaving}
              onClick={handleCancel}
              className='rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50'
            >
              Cancel request
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
