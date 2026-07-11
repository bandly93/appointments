import { useState, memo } from 'react'
import { Appointment } from '../types/Appointments'
import Notes from './Notes'

type Props = {
  appointment: Appointment
}

const AppointmentRow = ({ appointment }: Props ) => {
  const [expanded, setExpanded] = useState<boolean>(false)

  const statusBadgeClasses: Record<Appointment['status'], string> = {
    'Scheduled': 'bg-blue-100 text-blue-700',
    'Checked In': 'bg-amber-100 text-amber-700',
    'Completed': 'bg-green-100 text-green-700',
  }

  const { patientName, provider, time, status, notes } = appointment

  return <>
    <tr className='hover:bg-gray-50' onClick={() => setExpanded(expanded => !expanded)}>
      <td className='px-4 py-3 text-sm text-gray-900'>{patientName}</td>
      <td className='px-4 py-3 text-sm text-gray-600'>{provider}</td>
      <td className='px-4 py-3 text-sm text-gray-600'>{time}</td>
      <td className='px-4 py-3 text-sm'>
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClasses[status]}`}>
          {status}
        </span>
      </td>
    </tr>
    {/* Dropdown / Collapsible Row */}
    {expanded && (
      <tr>
        <td style={{ padding: "15px", color: "#555" }}>
          <Notes notes={notes} />
        </td>
      </tr>
    )}
  </>
}

export default memo(AppointmentRow)
