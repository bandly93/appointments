import { useEffect, useReducer, useMemo, useState } from 'react'
import { getAppointments } from '../fetchApi'
import { type Appointment } from '../types/Appointments'
import { ROW_GRID_CLASS } from './TableRow'
import VirtualizedWrapper from './VirtualizedWrapper'
import Modal from './Modal'
import Notes from './Notes'
import StatusSelect from './StatusSelect'
import { appointmentEvents } from '../events/appointmentEvents'
import DateSelector from './DateSelector'
import { useAppointmentFilters, type StatusFilter } from '../hooks/useAppointmentFilters'

type StateType = {
  loading: boolean
  error: string | null
  appointments: Appointment[]
  count: number | null
}

type ReducerTypes =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS', payload: { appointments: Appointment[], count: number } }
  | { type: 'FETCH_ERROR', payload: string }
  | { type: 'APPOINTMENT_UPDATED', payload: { appointmentId: number, status: Appointment['status'], stillMatchesFilter: boolean } }

const initialState: StateType = {
  loading: false,
  error: null,
  appointments: [],
  count: null
}

function reducer(state: StateType, action: ReducerTypes): StateType {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null }
    case 'FETCH_SUCCESS':
      return {
        ...state,
        loading: false,
        error: null,
        appointments: action.payload.appointments,
        count: action.payload.count
      }
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload }
    case 'APPOINTMENT_UPDATED': {
      const { appointmentId, status, stillMatchesFilter } = action.payload
      if (stillMatchesFilter) {
        return {
          ...state,
          appointments: state.appointments.map(appointment =>
            appointment.id === appointmentId
              ? { ...appointment, status }
              : appointment
          ),
        }
      }
      return {
        ...state,
        appointments: state.appointments.filter(appointment => appointment.id !== appointmentId),
        count: state.count === null ? state.count : Math.max(0, state.count - 1),
      }
    }
  }
}

type SortKey = 'patientName' | 'provider' | 'time' | 'status'
type SortDirection = 'asc' | 'desc'

const AppointmentsTable = () => {
  const [{ loading, error, appointments, count }, dispatch] = useReducer(reducer, initialState)
  const {
    search,
    setSearch,
    debouncedSearch,
    status,
    setStatus,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    clearFilters,
  } = useAppointmentFilters()
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null)
  const [sort, setSort] = useState<{ key: SortKey, direction: SortDirection } | null>(null)

  const selectedAppointment = appointments.find(({ id }) => id === selectedAppointmentId) ?? null

  const sortedAppointments = useMemo(() => {
    if (!sort) return appointments
    const { key, direction } = sort
    const multiplier = direction === 'asc' ? 1 : -1
    return [...appointments].sort((a, b) => a[key].localeCompare(b[key]) * multiplier)
  }, [appointments, sort])

  const toggleSort = (key: SortKey) => {
    setSort(current => {
      if (current?.key !== key) return { key, direction: 'asc' }
      if (current.direction === 'asc') return { key, direction: 'desc' }
      return null
    })
  }

  useEffect(() => {
    const callApi = async () => {
      dispatch({ type: 'FETCH_START' })
      try {
        const { appointments, count } = await getAppointments({ search: debouncedSearch, status, startDate, endDate })
        dispatch({ type: 'FETCH_SUCCESS', payload: { appointments, count } })
      } catch (error) {
        dispatch({ type: 'FETCH_ERROR', payload: error as string })
      }
    }
    callApi()
  }, [debouncedSearch, status, startDate, endDate])

  useEffect(() => {
    const unsubscribe = appointmentEvents.subscribe(
      'appointment.updated',
      (payload: { appointmentId: number, status: Appointment['status'] }) => {
        const stillMatchesFilter = status === 'All' || payload.status === status
        dispatch({
          type: 'APPOINTMENT_UPDATED',
          payload: { appointmentId: payload.appointmentId, status: payload.status, stillMatchesFilter },
        })
      }
    )
    return unsubscribe
  }, [status])

  return (
    <div className='w-full max-w-5xl mx-auto p-6'>
      <h1 className='text-2xl font-semibold text-gray-900 mb-4'>Appointments Table ({count && count > 0 && count})</h1>
      {error && (
        <div className='mb-4 rounded-md bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm'>
          {error}
        </div>
      )}
      <div className='flex flex-col sm:flex-row gap-3 mb-4'>
        {/* filtering search functionality here */}
        <input
          type='search'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='Search by patient name or provider'
          className='flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
        />
        <div className='flex items-center gap-2'>
          <label htmlFor='status-filter' className='text-sm font-medium text-gray-700 whitespace-nowrap'>
            Status
          </label>
          <select
            id='status-filter'
            value={status}
            onChange={e => {
              setStatus(e.target.value as StatusFilter)
            }}
            className='rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          >
            <option value='Scheduled'>Scheduled</option>
            <option value='Checked In'>Checked In</option>
            <option value='Completed'>Completed</option>
            <option value='All'>All</option>
          </select>
        </div>
        <DateSelector
          startDate={startDate}
          endDate={endDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
        />
        <button
          type='button'
          onClick={clearFilters}
          className='rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm text-gray-700 hover:bg-gray-50 whitespace-nowrap'
        >
          Clear filters
        </button>
      </div>
      {loading
        ? <div className='py-10 text-center text-gray-500'>Loading....</div>
        : (
          <div className='overflow-x-auto rounded-lg border border-gray-200 shadow-sm'>
            <div className={`${ROW_GRID_CLASS} bg-gray-50`}>
              {([
                ['patientName', 'Patient'],
                ['provider', 'Provider'],
                ['time', 'Time'],
                ['status', 'Status'],
              ] as [SortKey, string][]).map(([key, label]) => (
                <button
                  key={key}
                  type='button'
                  onClick={() => toggleSort(key)}
                  className='px-4 py-3 text-sm font-semibold text-gray-700 flex items-center gap-1 text-left hover:bg-gray-100'
                >
                  {label}
                  {sort?.key === key && (
                    <span className='text-gray-400'>{sort.direction === 'asc' ? '▲' : '▼'}</span>
                  )}
                </button>
              ))}
            </div>
            {appointments.length !== 0
              ? (
                <VirtualizedWrapper
                  appointments={sortedAppointments}
                  onOpenNotes={setSelectedAppointmentId}
                />
              ) : (
                <div className='px-4 py-10 text-center text-gray-500'>
                  No appointments found
                </div>
              )
            }
          </div>
        )
      }
      {selectedAppointment && (
        <Modal title={selectedAppointment.patientName} onClose={() => setSelectedAppointmentId(null)}>
          <dl className='grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm mb-4 pb-4 border-b border-gray-200'>
            <dt className='text-gray-500'>Provider</dt>
            <dd className='text-gray-900'>{selectedAppointment.provider}</dd>
            <dt className='text-gray-500'>Time</dt>
            <dd className='text-gray-900'>{selectedAppointment.time}</dd>
            <dt className='text-gray-500'>Status</dt>
            <dd className='text-gray-900'>
              <StatusSelect
                key={selectedAppointment.id}
                appointmentId={selectedAppointment.id}
                patientName={selectedAppointment.patientName}
                status={selectedAppointment.status}
              />
            </dd>
          </dl>
          <Notes appointmentId={selectedAppointment.id} notes={selectedAppointment.notes} />
        </Modal>
      )}
    </div>
  )
}

export default AppointmentsTable
