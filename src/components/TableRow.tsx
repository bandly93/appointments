import { useState, memo } from 'react'
import { Appointment } from '../types/Appointments'
import { updateAppointmentStatus } from '../fetchApi'
import { appointmentEvents } from '../events/appointmentEvents.ts'
import Notes from './Notes'

type Props = {
  appointment: Appointment
}

export const ROW_GRID_CLASS = 'grid grid-cols-[1.5fr_1fr_1fr_1fr]'

const STATUS_OPTIONS: Appointment['status'][] = ['Scheduled', 'Checked In', 'Completed']

const AppointmentRow = ({ appointment }: Props) => {
  const [expanded, setExpanded] = useState<boolean>(false)
  const [status, setStatus] = useState<Appointment['status']>(appointment.status)
  const [updating, setUpdating] = useState<boolean>(false)

  const statusBadgeClasses: Record<Appointment['status'], string> = {
    'Scheduled': 'bg-blue-100 text-blue-700',
    'Checked In': 'bg-amber-100 text-amber-700',
    'Completed': 'bg-green-100 text-green-700',
  }

  const { patientName, provider, time, notes } = appointment

  const handleStatusChange = async (newStatus: Appointment['status']) => {
    const previousStatus = status
    if (newStatus === previousStatus) return

    setStatus(newStatus)
    setUpdating(true)
    try {
      // post to backend
      await updateAppointmentStatus(appointment.id, newStatus)
      // publish to our emitter so all subscribers see the change.
      appointmentEvents.publish('appointment.updated', {
        appointmentId: appointment.id,
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
    <div className='bg-white border-b border-gray-200'>
      <div
        className={`${ROW_GRID_CLASS} hover:bg-gray-50 cursor-pointer`}
        onClick={() => setExpanded(expanded => !expanded)}
      >
        <div className='px-4 py-3 text-sm text-gray-900'>{patientName}</div>
        <div className='px-4 py-3 text-sm text-gray-600'>{provider}</div>
        <div className='px-4 py-3 text-sm text-gray-600 whitespace-nowrap'>{time}</div>
        <div className='px-4 py-3 text-sm'>
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
        </div>
      </div>
      {/* Dropdown / Collapsible section */}
      {expanded && (
        <div style={{ padding: "15px", color: "#555" }}>
          <Notes notes={notes} />
        </div>
      )}
    </div>
  )
}

export default memo(AppointmentRow)
