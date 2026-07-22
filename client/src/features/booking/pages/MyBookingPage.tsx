import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { getMyBooking, updateMyBooking, cancelMyBooking } from '../api/publicBookingApi'
import { type MyBookingRequest } from '../types/Booking'

export default function MyBookingPage() {
  const { requestId } = useParams<{ requestId: string }>()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [booking, setBooking] = useState<MyBookingRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!requestId || !token) {
      setLoading(false)
      setError('This link is missing required information')
      return
    }

    getMyBooking(requestId, token)
      .then((b) => {
        setBooking(b)
        setNotes(b.notes ?? '')
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Booking request not found'))
      .finally(() => setLoading(false))
  }, [requestId, token])

  async function handleSave() {
    if (!requestId) return
    setIsSaving(true)
    setError(null)
    try {
      const updated = await updateMyBooking(requestId, token, notes)
      setBooking(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update booking request')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleCancel() {
    if (!requestId) return
    setIsSaving(true)
    setError(null)
    try {
      const updated = await cancelMyBooking(requestId, token)
      setBooking(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel booking request')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return <div className='p-10 text-center text-gray-500'>Loading....</div>
  }

  if (error && !booking) {
    return (
      <div className='w-full max-w-xl mx-auto p-6'>
        <div className='rounded-md bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm'>{error}</div>
      </div>
    )
  }

  if (!booking) return null

  return (
    <div className='w-full max-w-xl mx-auto p-6'>
      <h1 className='text-2xl font-semibold text-gray-900 mb-1'>Your appointment request</h1>
      <p className='text-sm text-gray-500 mb-4'>
        with {booking.provider.displayName ?? 'the provider'}
      </p>

      <div className='rounded-lg border border-gray-200 shadow-sm p-4 mb-4'>
        <div className='text-sm text-gray-700 mb-1'>
          {new Date(booking.startsAt).toLocaleString(undefined, {
            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
          })}
        </div>
        <div className='text-sm font-medium text-gray-900'>Status: {booking.status}</div>
      </div>

      {error && (
        <div className='mb-4 rounded-md bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm'>
          {error}
        </div>
      )}

      {booking.status === 'PENDING'
        ? (
          <div>
            <div className='mb-4'>
              <label htmlFor='booking-notes' className='mb-1.5 block text-sm font-medium text-gray-700'>
                Notes
              </label>
              <textarea
                id='booking-notes'
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              />
            </div>
            <div className='flex justify-end gap-2'>
              <button
                type='button'
                disabled={isSaving}
                onClick={handleCancel}
                className='rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50'
              >
                Cancel request
              </button>
              <button
                type='button'
                disabled={isSaving}
                onClick={handleSave}
                className='rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 disabled:opacity-50'
              >
                Save notes
              </button>
            </div>
          </div>
        )
        : (
          <p className='text-sm text-gray-500'>This request can no longer be edited or cancelled.</p>
        )
      }
    </div>
  )
}
