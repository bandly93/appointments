import { useState, useEffect, useReducer } from 'react'
import { getAppointments } from '../fetchApi'
import { type Appointment } from '../types/Appointments'
import { useDebounce } from '../hooks/useDebounce'
import { ROW_GRID_CLASS } from './TableRow'
import VirtualizedWrapper from './VirtualizedWrapper'
import { appointmentEvents } from '../events/appointmentEvents'

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

const AppointmentsTable = () => {
  const [{ loading, error, appointments, count }, dispatch] = useReducer(reducer, initialState)
  const [search, setSearch] = useState<string>('')
  const [status, setStatus] = useState<'Scheduled' | 'Checked In' | 'Completed' | 'All'>('All')
  const debouncedSearch = useDebounce(search)

  useEffect(() => {
    const callApi = async () => {
      dispatch({ type: 'FETCH_START' })
      try {
        const { appointments, count } = await getAppointments({ search: debouncedSearch, status })
        dispatch({ type: 'FETCH_SUCCESS', payload: { appointments, count } })
      } catch (error) {
        dispatch({ type: 'FETCH_ERROR', payload: error as string })
      }
    }
    callApi()
  }, [debouncedSearch, status])

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
        <select
          value={status}
          onChange={e => {
            setStatus(e.target.value as "Scheduled" | "Checked In" | "Completed" | "All")
          }}
          className='rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
        >
          <option value='Scheduled'>Scheduled</option>
          <option value='Checked In'>Checked In</option>
          <option value='Completed'>Completed</option>
          <option value='All'>All</option>
        </select>
      </div>
      {loading
        ? <div className='py-10 text-center text-gray-500'>Loading....</div>
        : (
          <div className='overflow-x-auto rounded-lg border border-gray-200 shadow-sm'>
            <div className={`${ROW_GRID_CLASS} bg-gray-50`}>
              <div className='px-4 py-3 text-sm font-semibold text-gray-700'>Patient</div>
              <div className='px-4 py-3 text-sm font-semibold text-gray-700'>Provider</div>
              <div className='px-4 py-3 text-sm font-semibold text-gray-700'>Time</div>
              <div className='px-4 py-3 text-sm font-semibold text-gray-700'>Status</div>
            </div>
            {appointments.length !== 0
              ? <VirtualizedWrapper appointments={appointments} />
              : (
                <div className='px-4 py-10 text-center text-gray-500'>
                  No appointments found
                </div>
              )
            }
          </div>
        )
      }
    </div>
  )
}

export default AppointmentsTable
