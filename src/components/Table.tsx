  import { useState, useEffect } from 'react'
  import { getAppointments } from '../fetchApi'
  import { type Appointment } from '../types/Appointments'
  import { useDebounce } from '../hooks/useDebounce'
  import TableRow from './TableRow'

  const AppointmentsTable = () => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<any>(null)
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [search, setSearch] = useState<string>('')
    const [status, setStatus] = useState<'Scheduled' | 'Checked In' | 'Completed' | 'All'>('All')
    const [count, setCount] = useState<number | null>(null)
    const debouncedSearch = useDebounce(search)

    useEffect(() => {
      const callApi = async () => {
        try {
          setLoading(true)
          const { appointments, count } = await getAppointments({ search: debouncedSearch, status })
          setAppointments(appointments)
          setCount(count)
        } catch (error) {
          setError(error)
        } finally {
          setLoading(false)
        }
      }
      callApi()
    }, [debouncedSearch, status])

    return (
      <div className='w-full max-w-5xl mx-auto p-6'>
        <h1 className='text-2xl font-semibold text-gray-900 mb-4'>Appointment Table ({count && count > 0 && count})</h1>
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
              <table className='table-auto w-full text-left border-collapse'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-4 py-3 text-sm font-semibold text-gray-700'>Patient</th>
                    <th className='px-4 py-3 text-sm font-semibold text-gray-700'>Provider</th>
                    <th className='px-4 py-3 text-sm font-semibold text-gray-700'>Time</th>
                    <th className='px-4 py-3 text-sm font-semibold text-gray-700'>Status</th>
                  </tr>
                </thead>
                {appointments.length !== 0
                  ? (
                    <tbody className='divide-y divide-gray-200 bg-white'>
                      {appointments.map((appointment) =>
                        <TableRow key={appointment.id} appointment={appointment} />
                      )}
                    </tbody>
                  ) : (
                    <tbody>
                      <tr>
                        <td colSpan={4} className='px-4 py-10 text-center text-gray-500'>
                          No appointments found
                        </td>
                      </tr>
                    </tbody>
                  )
                }
              </table>
            </div>
          )
        }
      </div>
    )
  }

  export default AppointmentsTable
