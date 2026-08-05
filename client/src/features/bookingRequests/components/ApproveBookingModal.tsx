import { useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { approveBookingRequest } from '../api/bookingRequestsApi'
import { type BookingRequest } from '../types/BookingRequest'
import Modal from '../../../shared/components/Modal'
import DurationStepper, { nominalDurationMinutes } from '../../../shared/components/DurationStepper'

// Shared review step for approving a patient-submitted request — used by both
// the booking-requests list and the dashboard's pending-requests panel.
// Patients only ever request the availability rule's nominal slot length, so
// this is staff's one chance to extend/shrink the block before it becomes a
// real appointment.
export default function ApproveBookingModal({
  request,
  onClose,
  onApproved,
}: {
  request: BookingRequest
  onClose: () => void
  onApproved: () => void
}) {
  const { authFetch } = useAuth()

  const [durationMinutes, setDurationMinutes] = useState(() => nominalDurationMinutes(request))
  // The displayed value is rounded to the nearest 15 minutes for the
  // stepper's sake — sending it unconditionally would silently round down
  // any request whose slot length isn't already a multiple of 15. Only send
  // an override once staff actually touch the control.
  const [durationTouched, setDurationTouched] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleApprove() {
    setIsSubmitting(true)
    setError(null)
    try {
      await approveBookingRequest(authFetch, request.id, durationTouched ? durationMinutes : undefined)
      onApproved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve booking request')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal title='Approve booking' onClose={onClose}>
      <div className='mb-4 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700'>
        <div className='font-medium text-gray-900'>{request.patient.name}</div>
        <div className='text-gray-500'>{request.provider.displayName ?? 'Provider'}</div>
        <div className='mt-1'>
          {new Date(request.startsAt).toLocaleString(undefined, {
            weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
          })}
        </div>
      </div>

      <div className='mb-4'>
        <span className='mb-1.5 block text-sm font-medium text-gray-700'>Duration</span>
        <DurationStepper
          minutes={durationMinutes}
          onChange={(minutes) => {
            setDurationMinutes(minutes)
            setDurationTouched(true)
          }}
        />
      </div>

      {request.notes && (
        <p className='mb-4 text-xs text-gray-500 italic'>“{request.notes}”</p>
      )}

      {error && (
        <div className='mb-4 rounded-md bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm'>
          {error}
        </div>
      )}

      <div className='flex justify-end gap-2'>
        <button
          type='button'
          onClick={onClose}
          className='rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50'
        >
          Cancel
        </button>
        <button
          type='button'
          disabled={isSubmitting}
          onClick={() => void handleApprove()}
          className='rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50'
        >
          {isSubmitting ? 'Approving…' : 'Approve'}
        </button>
      </div>
    </Modal>
  )
}
