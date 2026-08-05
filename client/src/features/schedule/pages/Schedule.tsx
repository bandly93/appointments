import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import Navbar from '../../layout/Navbar'
import Modal from '../../../shared/components/Modal'
import WeekCalendar, { type CalendarBlock } from '../components/WeekCalendar'
import ProviderSelect from '../../appointments/components/ProviderSelect'
import { getAppointments, updateAppointmentStatus, updateAppointmentDuration } from '../../appointments/api/appointmentsApi'
import DurationStepper, { nominalDurationMinutes } from '../../../shared/components/DurationStepper'
import { type Appointment, type AppointmentStatus } from '../../appointments/types/Appointment'
import { getBookingRequests, approveBookingRequest, rejectBookingRequest } from '../../bookingRequests/api/bookingRequestsApi'
import { type BookingRequest } from '../../bookingRequests/types/BookingRequest'
import { bookingRequestEvents, BOOKING_REQUESTS_CHANGED } from '../../bookingRequests/events'
import StatusBadge from '../../bookingRequests/components/StatusBadge'
import { addDays, startOfWeek, toLocalDateString } from '../lib/week'

const APPOINTMENT_STATUSES: AppointmentStatus[] = ['SCHEDULED', 'COMPLETED', 'CANCELLED']

type Selection =
  | { kind: 'appointment'; appointment: Appointment }
  | { kind: 'request'; request: BookingRequest }

export default function Schedule() {
  const { authFetch, user } = useAuth()
  const isProvider = user?.role === 'PROVIDER'
  const canEditStatus = user?.role === 'STAFF' || user?.role === 'ADMIN'

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [providerId, setProviderId] = useState<string | 'All'>(isProvider && user ? user.id : 'All')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [requests, setRequests] = useState<BookingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Selection | null>(null)
  const [isActing, setIsActing] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    const provider = providerId === 'All' ? undefined : providerId
    const weekStartMs = weekStart.getTime()
    const weekEndMs = addDays(weekStart, 7).getTime()
    try {
      const [appts, pending] = await Promise.all([
        getAppointments(authFetch, {
          from: toLocalDateString(weekStart),
          to: toLocalDateString(addDays(weekStart, 6)),
          providerId: provider,
        }),
        getBookingRequests(authFetch, { status: 'PENDING', providerId: provider }),
      ])
      setAppointments(appts)
      setRequests(pending.filter((r) => {
        const t = new Date(r.startsAt).getTime()
        return t >= weekStartMs && t < weekEndMs
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schedule')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart, providerId])

  useEffect(() => {
    setLoading(true)
    load().finally(() => setLoading(false))
  }, [load])

  // Decisions made elsewhere (dashboard panel, requests page) show up here too.
  useEffect(() => bookingRequestEvents.subscribe(BOOKING_REQUESTS_CHANGED, load), [load])

  const blocks: CalendarBlock[] = useMemo(() => {
    const showProviderName = providerId === 'All'
    return [
      ...appointments.map((a): CalendarBlock => ({
        id: `a:${a.id}`,
        startsAt: a.startsAt,
        endsAt: a.endsAt,
        title: a.patient.name,
        subtitle: showProviderName ? a.provider.displayName ?? 'Provider' : undefined,
        tone: a.status === 'CANCELLED' ? 'gray' : a.status === 'COMPLETED' ? 'green' : 'blue',
        strike: a.status === 'CANCELLED',
      })),
      ...requests.map((r): CalendarBlock => ({
        id: `r:${r.id}`,
        startsAt: r.startsAt,
        endsAt: r.endsAt,
        title: r.patient.name,
        subtitle: showProviderName ? r.provider.displayName ?? 'Provider' : undefined,
        tone: 'amber',
        dashed: true,
      })),
    ]
  }, [appointments, requests, providerId])

  function handleBlockClick(id: string) {
    const [kind, rawId] = [id.slice(0, 1), id.slice(2)]
    if (kind === 'a') {
      const appointment = appointments.find((a) => a.id === rawId)
      if (appointment) setSelected({ kind: 'appointment', appointment })
    } else {
      const request = requests.find((r) => r.id === rawId)
      if (request) setSelected({ kind: 'request', request })
    }
  }

  async function handleDecision(id: string, decision: 'approve' | 'decline') {
    setIsActing(true)
    setError(null)
    try {
      if (decision === 'approve') {
        await approveBookingRequest(authFetch, id)
      } else {
        await rejectBookingRequest(authFetch, id)
      }
      setSelected(null)
      bookingRequestEvents.publish(BOOKING_REQUESTS_CHANGED, { id, decision })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update request')
      setSelected(null)
    } finally {
      setIsActing(false)
    }
  }

  async function handleStatusChange(id: string, status: AppointmentStatus) {
    setIsActing(true)
    setError(null)
    try {
      const updated = await updateAppointmentStatus(authFetch, id, status)
      setAppointments((current) => current.map((a) => (a.id === id ? updated : a)))
      setSelected({ kind: 'appointment', appointment: updated })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update appointment')
    } finally {
      setIsActing(false)
    }
  }

  async function handleDurationChange(id: string, durationMinutes: number) {
    setIsActing(true)
    setError(null)
    try {
      const updated = await updateAppointmentDuration(authFetch, id, durationMinutes)
      setAppointments((current) => current.map((a) => (a.id === id ? updated : a)))
      setSelected({ kind: 'appointment', appointment: updated })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update appointment duration')
    } finally {
      setIsActing(false)
    }
  }

  const weekEnd = addDays(weekStart, 6)
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth()
  const weekLabel = `${weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString(
    undefined,
    sameMonth ? { day: 'numeric', year: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' },
  )}`
  const isCurrentWeek = toLocalDateString(weekStart) === toLocalDateString(startOfWeek(new Date()))

  const navButtonClasses =
    'rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50'

  return (
    <div className='flex flex-col'>
      <Navbar />
      <div className='w-full max-w-6xl mx-auto p-6'>
        <div className='flex flex-wrap items-center justify-between gap-3 mb-4'>
          <div>
            <h1 className='text-2xl font-semibold text-gray-900'>Schedule</h1>
            <p className='text-sm text-gray-500'>{weekLabel}</p>
          </div>
          <div className='flex items-center gap-2'>
            <ProviderSelect value={providerId} onChange={setProviderId} />
            <div className='flex items-center gap-1'>
              <button type='button' onClick={() => setWeekStart((w) => addDays(w, -7))} className={navButtonClasses} aria-label='Previous week'>
                ‹
              </button>
              <button
                type='button'
                onClick={() => setWeekStart(startOfWeek(new Date()))}
                disabled={isCurrentWeek}
                className={`${navButtonClasses} disabled:opacity-50`}
              >
                This week
              </button>
              <button type='button' onClick={() => setWeekStart((w) => addDays(w, 7))} className={navButtonClasses} aria-label='Next week'>
                ›
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className='mb-4 rounded-md bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm'>
            {error}
          </div>
        )}

        <div className='mb-3 flex flex-wrap items-center gap-4 text-xs text-gray-600'>
          <span className='flex items-center gap-1.5'>
            <span className='h-3 w-3 rounded-sm border-l-4 border-blue-400 bg-blue-50' /> Scheduled
          </span>
          <span className='flex items-center gap-1.5'>
            <span className='h-3 w-3 rounded-sm border border-dashed border-amber-400 bg-amber-50' /> Pending approval
          </span>
          <span className='flex items-center gap-1.5'>
            <span className='h-3 w-3 rounded-sm border-l-4 border-green-400 bg-green-50' /> Completed
          </span>
          <span className='flex items-center gap-1.5'>
            <span className='h-3 w-3 rounded-sm border-l-4 border-gray-300 bg-gray-50' /> Cancelled
          </span>
        </div>

        {loading
          ? <div className='py-16 text-center text-gray-500'>Loading....</div>
          : <WeekCalendar weekStart={weekStart} blocks={blocks} onBlockClick={handleBlockClick} />
        }

        {selected && (
          <Modal
            title={selected.kind === 'request' ? 'Booking request' : 'Appointment'}
            onClose={() => setSelected(null)}
          >
            <EventDetails
              selection={selected}
              isActing={isActing}
              canEditStatus={canEditStatus}
              canEditDuration={
                selected.kind === 'appointment' &&
                (canEditStatus || (isProvider && selected.appointment.providerId === user?.id))
              }
              canDecide={selected.kind === 'request' && (!isProvider || selected.request.providerId === user?.id)}
              onDecision={handleDecision}
              onStatusChange={handleStatusChange}
              onDurationChange={handleDurationChange}
            />
          </Modal>
        )}
      </div>
    </div>
  )
}

function EventDetails({
  selection,
  isActing,
  canEditStatus,
  canEditDuration,
  canDecide,
  onDecision,
  onStatusChange,
  onDurationChange,
}: {
  selection: Selection
  isActing: boolean
  canEditStatus: boolean
  canEditDuration: boolean
  canDecide: boolean
  onDecision: (id: string, decision: 'approve' | 'decline') => void
  onStatusChange: (id: string, status: AppointmentStatus) => void
  onDurationChange: (id: string, durationMinutes: number) => void
}) {
  const data = selection.kind === 'request' ? selection.request : selection.appointment

  return (
    <div className='flex flex-col gap-3 text-sm'>
      <div>
        <div className='font-medium text-gray-900'>
          {new Date(data.startsAt).toLocaleString(undefined, {
            weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
          })}
          {' – '}
          {new Date(data.endsAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
        </div>
        <div className='text-gray-500'>with {data.provider.displayName ?? 'Provider'}</div>
      </div>

      <div className='rounded-md border border-gray-200 bg-gray-50 px-3 py-2'>
        <div className='font-medium text-gray-900'>{data.patient.name}</div>
        <div className='text-gray-600'>{data.patient.email}</div>
        {data.patient.phone && <div className='text-gray-600'>{data.patient.phone}</div>}
      </div>

      {data.notes && <p className='italic text-gray-600'>“{data.notes}”</p>}

      {selection.kind === 'request'
        ? (
          <div className='flex items-center justify-between gap-2'>
            <StatusBadge status={selection.request.status} />
            {canDecide && (
              <div className='flex gap-2'>
                <button
                  type='button'
                  disabled={isActing}
                  onClick={() => onDecision(selection.request.id, 'approve')}
                  className='rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-green-500 disabled:opacity-50'
                >
                  Approve
                </button>
                <button
                  type='button'
                  disabled={isActing}
                  onClick={() => onDecision(selection.request.id, 'decline')}
                  className='rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50'
                >
                  Decline
                </button>
              </div>
            )}
          </div>
        )
        : (
          <div className='flex items-center justify-between gap-2'>
            <span className='text-gray-600'>Status</span>
            {canEditStatus
              ? (
                <select
                  value={selection.appointment.status}
                  disabled={isActing}
                  onChange={(e) => onStatusChange(selection.appointment.id, e.target.value as AppointmentStatus)}
                  className='rounded-md border border-gray-300 px-2 py-1 text-sm shadow-sm disabled:opacity-50'
                >
                  {APPOINTMENT_STATUSES.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              )
              : <span className='font-medium text-gray-900'>{selection.appointment.status}</span>
            }
          </div>
        )
      }

      {selection.kind === 'appointment' && canEditDuration && selection.appointment.status !== 'CANCELLED' && (
        <div className='flex items-center justify-between gap-2'>
          <span className='text-gray-600'>Duration</span>
          <AppointmentDurationEditor
            appointment={selection.appointment}
            isActing={isActing}
            onSave={onDurationChange}
          />
        </div>
      )}
    </div>
  )
}

function AppointmentDurationEditor({
  appointment,
  isActing,
  onSave,
}: {
  appointment: Appointment
  isActing: boolean
  onSave: (id: string, durationMinutes: number) => void
}) {
  const [minutes, setMinutes] = useState(() => nominalDurationMinutes(appointment))

  useEffect(() => {
    setMinutes(nominalDurationMinutes(appointment))
  }, [appointment.id, appointment.startsAt, appointment.endsAt])

  const changed = minutes !== nominalDurationMinutes(appointment)

  return (
    <div className='flex items-center gap-2'>
      <DurationStepper minutes={minutes} onChange={setMinutes} />
      {changed && (
        <button
          type='button'
          disabled={isActing}
          onClick={() => onSave(appointment.id, minutes)}
          className='rounded-md bg-blue-600 px-2.5 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50'
        >
          Save
        </button>
      )}
    </div>
  )
}
