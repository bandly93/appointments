import { useEffect, useState } from 'react'
import { appointmentEvents } from '../events/appointmentEvents'

type AppointmentUpdatedPayload = {
  appointmentId: number
  patientName: string
  status: string
  previousStatus?: string
}

type ActivityItem = AppointmentUpdatedPayload & {
  id: string
  receivedAt: Date
}

const MAX_ITEMS = 50

const ActivityFeed = () => {
  const [items, setItems] = useState<ActivityItem[]>([])

  useEffect(() => {
    const unsubscribe = appointmentEvents.subscribe(
      'appointment.updated',
      (payload: AppointmentUpdatedPayload) => {
        const item: ActivityItem = {
          ...payload,
          id: `${payload.appointmentId}-${Date.now()}`,
          receivedAt: new Date(),
        }
        setItems(current => [item, ...current].slice(0, MAX_ITEMS))
      }
    )
    return unsubscribe
  }, [])

  return (
    <div className='w-full max-w-sm border border-gray-200 rounded-lg shadow-sm bg-white'>
      <div className='px-4 py-3 border-b border-gray-200'>
        <h2 className='text-sm font-semibold text-gray-900'>Activity Feed</h2>
      </div>
      {items.length === 0 ? (
        <div className='px-4 py-6 text-center text-sm text-gray-500'>
          No activity yet
        </div>
      ) : (
        <ul className='divide-y divide-gray-100 max-h-96 overflow-y-auto'>
          {items.map(item => (
            <li key={item.id} className='px-4 py-3 text-sm'>
              <div className='text-gray-900'>
                <span className='font-medium'>{item.patientName}</span>
                {item.previousStatus ? (
                  <> moved from <span className='font-medium'>{item.previousStatus}</span> to{' '}
                    <span className='font-medium'>{item.status}</span></>
                ) : (
                  <> updated to <span className='font-medium'>{item.status}</span></>
                )}
              </div>
              <div className='text-xs text-gray-500 mt-0.5'>
                {item.receivedAt.toLocaleTimeString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default ActivityFeed
