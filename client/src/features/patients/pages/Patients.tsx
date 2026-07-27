import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useDebounce } from '../../../shared/hooks/useDebounce'
import { getPatients } from '../api/patientsApi'
import { type Patient } from '../types/Patient'
import Navbar from '../../layout/Navbar'

function formatDob(dateOfBirth: string | null): string {
  if (!dateOfBirth) return '—'
  const [y, m, d] = dateOfBirth.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Patients() {
  const { authFetch } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setError(null)
    getPatients(authFetch, debouncedSearch || undefined)
      .then(setPatients)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load patients'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  return (
    <div className='flex flex-col'>
      <Navbar />
      <div className='w-full max-w-5xl mx-auto p-6'>
        <div className='flex flex-wrap items-center justify-between gap-3 mb-4'>
          <h1 className='text-2xl font-semibold text-gray-900'>Patients ({patients.length})</h1>
          <input
            type='search'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search name, email, or phone'
            className='w-72 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          />
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
              <div className='grid grid-cols-[1.2fr_1.4fr_1fr_140px] bg-gray-50'>
                <div className='px-4 py-3 text-sm font-semibold text-gray-700'>Name</div>
                <div className='px-4 py-3 text-sm font-semibold text-gray-700'>Email</div>
                <div className='px-4 py-3 text-sm font-semibold text-gray-700'>Phone</div>
                <div className='px-4 py-3 text-sm font-semibold text-gray-700'>Date of birth</div>
              </div>
              {patients.length !== 0
                ? patients.map((p) => (
                  <button
                    key={p.id}
                    type='button'
                    onClick={() => navigate(`/patients/${p.id}`)}
                    className='grid grid-cols-[1.2fr_1.4fr_1fr_140px] w-full border-t border-gray-200 text-left hover:bg-gray-50'
                  >
                    <div className='px-4 py-3 text-sm font-medium text-gray-900'>{p.name}</div>
                    <div className='px-4 py-3 text-sm text-gray-700'>{p.email}</div>
                    <div className='px-4 py-3 text-sm text-gray-700'>{p.phone ?? '—'}</div>
                    <div className='px-4 py-3 text-sm text-gray-700'>{formatDob(p.dateOfBirth)}</div>
                  </button>
                ))
                : (
                  <div className='px-4 py-10 text-center text-gray-500'>
                    {debouncedSearch ? 'No patients match your search' : 'No patients yet'}
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
