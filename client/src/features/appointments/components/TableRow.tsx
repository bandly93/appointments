import { memo } from 'react'
import { Appointment } from '../types/Appointments'
import StatusSelect from './StatusSelect'

type Props = {
  appointment: Appointment
  onOpenNotes: (appointmentId: number) => void
}

export const ROW_GRID_CLASS = 'grid grid-cols-[1.5fr_1fr_1fr_1fr]'

const AppointmentRow = ({ appointment, onOpenNotes }: Props) => {
  const { patientName, provider, time, status } = appointment

  return (
    <div className='bg-white border-b border-gray-200'>
      <div
        className={`${ROW_GRID_CLASS} hover:bg-gray-50 cursor-pointer`}
        onClick={() => onOpenNotes(appointment.id)}
      >
        <div className='px-4 py-3 text-sm text-gray-900'>{patientName}</div>
        <div className='px-4 py-3 text-sm text-gray-600'>{provider}</div>
        <div className='px-4 py-3 text-sm text-gray-600 whitespace-nowrap'>{time}</div>
        <div className='px-4 py-3 text-sm'>
          <StatusSelect appointmentId={appointment.id} patientName={patientName} status={status} />
        </div>
      </div>
    </div>
  )
}

export default memo(AppointmentRow)
