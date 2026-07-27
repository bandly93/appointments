import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { getAppointments, updateAppointmentStatus } from '../api/appointmentsApi'
import { type Appointment, type AppointmentStatus } from '../types/Appointment'
import { todayDateString } from './DateNav'
import ProviderSelect from './ProviderSelect'

const STATUSES: AppointmentStatus[] = ['SCHEDULED', 'COMPLETED', 'CANCELLED']

export default function AppointmentsTable({ date, refreshToken = 0 }: { date: string; refreshToken?: number }) {
  const { authFetch, user } = useAuth()
  const canEditStatus = user?.role === 'STAFF' || user?.role === 'ADMIN'

  const [providerId, setProviderId] = useState<string | 'All'>(
    user?.role === 'PROVIDER' ? user.id : 'All'
  )
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getAppointments(authFetch, { date, providerId: providerId === 'All' ? undefined : providerId })
      .then(setAppointments)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load appointments'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, providerId, refreshToken])

  async function handleStatusChange(id: string, status: AppointmentStatus) {
    setSavingId(id)
    setError(null)
    try {
      const updated = await updateAppointmentStatus(authFetch, id, status)
      setAppointments((current) => current.map((a) => (a.id === id ? updated : a)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update appointment')
    } finally {
      setSavingId(null)
    }
  }

  const isToday = date === todayDateString()

  return (
    <div>
      <div className='flex items-start justify-between gap-4 mb-1'>
        <h1 className='text-2xl font-semibold text-gray-900'>
          {isToday ? "Today's appointments" : 'Appointments'}
        </h1>
        <ProviderSelect value={providerId} onChange={setProviderId} />
      </div>
      <p className='text-sm text-gray-500 mb-4'>
        {new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
          weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
        })}
        {' · '}{appointments.length} appointment{appointments.length === 1 ? '' : 's'}
      </p>

      {error && (
        <div className='mb-4 rounded-md bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm'>
          {error}
        </div>
      )}

      {loading
        ? <div className='py-10 text-center text-gray-500'>Loading....</div>
        : (
          <div className='overflow-x-auto rounded-lg border border-gray-200 shadow-sm'>
            <div className='grid grid-cols-[140px_1fr_1fr_160px] bg-gray-50'>
              <div className='px-4 py-3 text-sm font-semibold text-gray-700'>Time</div>
              <div className='px-4 py-3 text-sm font-semibold text-gray-700'>Patient</div>
              <div className='px-4 py-3 text-sm font-semibold text-gray-700'>Provider</div>
              <div className='px-4 py-3 text-sm font-semibold text-gray-700'>Status</div>
            </div>
            {appointments.length !== 0
              ? appointments.map((a) => (
                <div key={a.id} className='grid grid-cols-[140px_1fr_1fr_160px] border-t border-gray-200'>
                  <div className='px-4 py-3 text-sm text-gray-700'>
                    {new Date(a.startsAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                  </div>
                  <div className='px-4 py-3 text-sm text-gray-900'>
                    {a.patient.name}
                    <div className='text-xs text-gray-500'>{a.patient.email}</div>
                  </div>
                  <div className='px-4 py-3 text-sm text-gray-700'>{a.provider.displayName ?? 'Provider'}</div>
                  <div className='px-4 py-3 text-sm'>
                    {canEditStatus
                      ? (
                        <select
                          value={a.status}
                          disabled={savingId === a.id}
                          onChange={(e) => handleStatusChange(a.id, e.target.value as AppointmentStatus)}
                          className='rounded-md border border-gray-300 px-2 py-1 text-sm shadow-sm disabled:opacity-50'
                        >
                          {STATUSES.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      )
                      : <span className='text-gray-700'>{a.status}</span>
                    }
                  </div>
                </div>
              ))
              : (
                <div className='px-4 py-10 text-center text-gray-500'>
                  {isToday ? 'No appointments today' : 'No appointments on this date'}
                </div>
              )
            }
          </div>
        )
      }
    </div>
  )
}
