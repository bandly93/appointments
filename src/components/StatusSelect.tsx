import { useEffect, useState } from 'react'
import { Appointment } from '../types/Appointments'
import { updateAppointmentStatus } from '../fetchApi'
import { appointmentEvents } from '../events/appointmentEvents.ts'

type Props = {
  appointmentId: number
  patientName: string
  status: Appointment['status']
}

const STATUS_OPTIONS: Appointment['status'][] = ['Scheduled', 'Checked In', 'Completed']

const statusBadgeClasses: Record<Appointment['status'], string> = {
  'Scheduled': 'bg-blue-100 text-blue-700',
  'Checked In': 'bg-amber-100 text-amber-700',
  'Completed': 'bg-green-100 text-green-700',
}

export const statusDotClasses: Record<Appointment['status'], string> = {
  'Scheduled': 'bg-blue-500',
  'Checked In': 'bg-amber-500',
  'Completed': 'bg-green-500',
}

export const statusAccentClasses: Record<Appointment['status'], string> = {
  'Scheduled': 'border-l-blue-500',
  'Checked In': 'border-l-amber-500',
  'Completed': 'border-l-green-500',
}

export default function StatusSelect({ appointmentId, patientName, status: initialStatus }: Props) {
  const [status, setStatus] = useState<Appointment['status']>(initialStatus)
  const [updating, setUpdating] = useState<boolean>(false)

  useEffect(() => {
    setStatus(initialStatus)
  }, [initialStatus])

  const handleStatusChange = async (newStatus: Appointment['status']) => {
    const previousStatus = status
    if (newStatus === previousStatus) return

    setStatus(newStatus)
    setUpdating(true)
    try {
      // post to backend
      await updateAppointmentStatus(appointmentId, newStatus)
      // publish to our emitter so all subscribers see the change.
      appointmentEvents.publish('appointment.updated', {
        appointmentId,
        patientName,
        status: newStatus,
        previousStatus,
      })
    } catch (error) {
      setStatus(previousStatus)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <select
      value={status}
      disabled={updating}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => handleStatusChange(e.target.value as Appointment['status'])}
      className={`rounded-full border-0 px-2.5 py-0.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 ${statusBadgeClasses[status]}`}
    >
      {STATUS_OPTIONS.map(option => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  )
}
