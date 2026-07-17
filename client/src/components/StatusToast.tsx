import { useEffect, useState } from 'react'
import { appointmentEvents } from '../events/appointmentEvents'
import { statusAccentClasses, statusDotClasses } from './StatusSelect'

type AppointmentUpdatedPayload = {
  appointmentId: number
  patientName: string
  status: string
  previousStatus?: string
}

type ToastItem = AppointmentUpdatedPayload & {
  id: string
  leaving: boolean
}

const DISPLAY_MS = 3000
const EXIT_MS = 300

const StatusToast = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    const unsubscribe = appointmentEvents.subscribe(
      'appointment.updated',
      (payload: AppointmentUpdatedPayload) => {
        const id = `${payload.appointmentId}-${Date.now()}`
        setToasts(current => [...current, { ...payload, id, leaving: false }])

        setTimeout(() => {
          setToasts(current =>
            current.map(toast => (toast.id === id ? { ...toast, leaving: true } : toast))
          )
        }, DISPLAY_MS)

        setTimeout(() => {
          setToasts(current => current.filter(toast => toast.id !== id))
        }, DISPLAY_MS + EXIT_MS)
      }
    )
    return unsubscribe
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className='fixed top-4 right-4 z-50 flex flex-col gap-2 w-80'>
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`rounded-lg border border-l-4 border-gray-200 bg-white shadow-xl ring-1 ring-black/5 px-4 py-3 text-sm transition-all duration-300 ease-out ${
            statusAccentClasses[toast.status as keyof typeof statusAccentClasses] ?? 'border-l-gray-300'
          } ${
            toast.leaving ? 'opacity-0 translate-x-2 scale-95' : 'animate-toast-in'
          }`}
        >
          <div className='text-gray-900'>
            <span className={`inline-block h-2 w-2 rounded-full mr-1.5 align-middle ${statusDotClasses[toast.status as keyof typeof statusDotClasses] ?? 'bg-gray-400'}`} />
            <span className='font-medium'>{toast.patientName}</span>
            {toast.previousStatus ? (
              <> moved from <span className='font-medium'>{toast.previousStatus}</span> to{' '}
                <span className='font-medium'>{toast.status}</span></>
            ) : (
              <> updated to <span className='font-medium'>{toast.status}</span></>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default StatusToast
