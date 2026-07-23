import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { getAppointments } from '../api/appointmentsApi'
import { type Appointment, type AppointmentStatus } from '../types/Appointment'
import Navbar from '../../layout/Navbar'
import ProviderSelect from '../components/ProviderSelect'

const STATUSES: (AppointmentStatus | 'All')[] = ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'All']

type SortKey = 'patient' | 'provider' | 'startsAt' | 'status'
type SortDirection = 'asc' | 'desc'

export default function AllAppointments() {
  const { authFetch } = useAuth()
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'All'>('All')
  const [providerId, setProviderId] = useState<string | 'All'>('All')
  const [search, setSearch] = useState('')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection } | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getAppointments(authFetch, {
      status: statusFilter === 'All' ? undefined : statusFilter,
      providerId: providerId === 'All' ? undefined : providerId,
    })
      .then(setAppointments)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load appointments'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, providerId])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return appointments
    return appointments.filter(
      (a) =>
        a.patient.name.toLowerCase().includes(term) ||
        a.patient.email.toLowerCase().includes(term) ||
        (a.provider.displayName ?? '').toLowerCase().includes(term)
    )
  }, [appointments, search])

  const sorted = useMemo(() => {
    if (!sort) return filtered
    const { key, direction } = sort
    const multiplier = direction === 'asc' ? 1 : -1
    const valueOf = (a: Appointment) => {
      switch (key) {
        case 'patient': return a.patient.name
        case 'provider': return a.provider.displayName ?? ''
        case 'startsAt': return a.startsAt
        case 'status': return a.status
      }
    }
    return [...filtered].sort((a, b) => valueOf(a).localeCompare(valueOf(b)) * multiplier)
  }, [filtered, sort])

  function toggleSort(key: SortKey) {
    setSort((current) => {
      if (current?.key !== key) return { key, direction: 'asc' }
      if (current.direction === 'asc') return { key, direction: 'desc' }
      return null
    })
  }

  const columns: [SortKey, string][] = [
    ['patient', 'Patient'],
    ['provider', 'Provider'],
    ['startsAt', 'Time'],
    ['status', 'Status'],
  ]

  return (
    <div className='flex flex-col'>
      <Navbar />
      <div className='w-full max-w-5xl mx-auto p-6'>
        <h1 className='text-2xl font-semibold text-gray-900 mb-4'>All appointments ({sorted.length})</h1>

        <div className='flex flex-col sm:flex-row gap-3 mb-4'>
          <input
            type='search'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search by patient or provider'
            className='flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AppointmentStatus | 'All')}
            className='rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <ProviderSelect value={providerId} onChange={setProviderId} />
        </div>

        {error && (
          <div className='mb-4 rounded-md bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm'>
            {error}
          </div>
        )}

        {loading
          ? <div className='py-10 text-center text-gray-500'>Loading....</div>
          : (
            <div className='overflow-x-auto rounded-lg border border-gray-200 shadow-sm'>
              <div className='grid grid-cols-[1fr_1fr_180px_120px] bg-gray-50'>
                {columns.map(([key, label]) => (
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
              {sorted.length !== 0
                ? sorted.map((a) => (
                  <div key={a.id} className='grid grid-cols-[1fr_1fr_180px_120px] border-t border-gray-200'>
                    <div className='px-4 py-3 text-sm text-gray-900'>
                      {a.patient.name}
                      <div className='text-xs text-gray-500'>{a.patient.email}</div>
                    </div>
                    <div className='px-4 py-3 text-sm text-gray-700'>{a.provider.displayName ?? 'Provider'}</div>
                    <div className='px-4 py-3 text-sm text-gray-700'>
                      {new Date(a.startsAt).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
                      })}
                    </div>
                    <div className='px-4 py-3 text-sm text-gray-700'>{a.status}</div>
                  </div>
                ))
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
    </div>
  )
}
