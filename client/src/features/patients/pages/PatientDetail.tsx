import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { getPatient, updatePatient } from '../api/patientsApi'
import { type PatientDetail as PatientDetailType } from '../types/Patient'
import Navbar from '../../layout/Navbar'

function formatDob(dateOfBirth: string | null): string {
  if (!dateOfBirth) return '—'
  const [y, m, d] = dateOfBirth.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function PatientDetail() {
  const { patientId } = useParams<{ patientId: string }>()
  const { authFetch, user } = useAuth()
  const canEdit = user?.role === 'STAFF' || user?.role === 'ADMIN'

  const [patient, setPatient] = useState<PatientDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', dateOfBirth: '', address: '' })

  useEffect(() => {
    if (!patientId) return
    getPatient(authFetch, patientId)
      .then((p) => {
        setPatient(p)
        setForm({ name: p.name, phone: p.phone ?? '', dateOfBirth: p.dateOfBirth ?? '', address: p.address ?? '' })
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load patient'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId])

  async function handleSave() {
    if (!patientId || !patient) return
    setIsSaving(true)
    setError(null)
    try {
      const updated = await updatePatient(authFetch, patientId, {
        name: form.name.trim() || undefined,
        phone: form.phone.trim() || null,
        dateOfBirth: form.dateOfBirth || null,
        address: form.address.trim() || null,
      })
      setPatient({ ...patient, ...updated })
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update patient')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className='flex flex-col'>
        <Navbar />
        <div className='py-10 text-center text-gray-500'>Loading....</div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className='flex flex-col'>
        <Navbar />
        <div className='w-full max-w-4xl mx-auto p-6'>
          <div className='rounded-md bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm'>
            {error ?? 'Patient not found'}
          </div>
        </div>
      </div>
    )
  }

  const inputClasses =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'

  return (
    <div className='flex flex-col'>
      <Navbar />
      <div className='w-full max-w-4xl mx-auto p-6'>
        <Link to='/patients' className='text-sm text-blue-600 hover:text-blue-800'>← All patients</Link>
        <div className='flex items-start justify-between gap-4 mt-2 mb-4'>
          <div>
            <h1 className='text-2xl font-semibold text-gray-900'>{patient.name}</h1>
            <p className='text-sm text-gray-500'>
              Patient since {new Date(patient.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </p>
          </div>
          {canEdit && !isEditing && (
            <button
              type='button'
              onClick={() => setIsEditing(true)}
              className='rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50'
            >
              Edit details
            </button>
          )}
        </div>

        {error && (
          <div className='mb-4 rounded-md bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm'>
            {error}
          </div>
        )}

        <div className='rounded-lg border border-gray-200 bg-white shadow-sm p-4 mb-6'>
          {isEditing
            ? (
              <div className='grid gap-3 sm:grid-cols-2'>
                <div>
                  <label htmlFor='edit-name' className='mb-1 block text-sm font-medium text-gray-700'>Name</label>
                  <input id='edit-name' type='text' value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClasses} />
                </div>
                <div>
                  <label htmlFor='edit-phone' className='mb-1 block text-sm font-medium text-gray-700'>Phone</label>
                  <input id='edit-phone' type='tel' value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClasses} />
                </div>
                <div>
                  <label htmlFor='edit-dob' className='mb-1 block text-sm font-medium text-gray-700'>Date of birth</label>
                  <input id='edit-dob' type='date' value={form.dateOfBirth} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} className={inputClasses} />
                </div>
                <div>
                  <label htmlFor='edit-address' className='mb-1 block text-sm font-medium text-gray-700'>Address</label>
                  <input id='edit-address' type='text' value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClasses} />
                </div>
                <div className='sm:col-span-2 flex justify-end gap-2'>
                  <button
                    type='button'
                    disabled={isSaving}
                    onClick={() => {
                      setIsEditing(false)
                      setForm({ name: patient.name, phone: patient.phone ?? '', dateOfBirth: patient.dateOfBirth ?? '', address: patient.address ?? '' })
                    }}
                    className='rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50'
                  >
                    Cancel
                  </button>
                  <button
                    type='button'
                    disabled={isSaving}
                    onClick={handleSave}
                    className='rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 disabled:opacity-50'
                  >
                    Save
                  </button>
                </div>
              </div>
            )
            : (
              <dl className='grid gap-x-6 gap-y-3 sm:grid-cols-2 text-sm'>
                <div>
                  <dt className='text-gray-500'>Email</dt>
                  <dd className='font-medium text-gray-900'>{patient.email}</dd>
                </div>
                <div>
                  <dt className='text-gray-500'>Phone</dt>
                  <dd className='font-medium text-gray-900'>{patient.phone ?? '—'}</dd>
                </div>
                <div>
                  <dt className='text-gray-500'>Date of birth</dt>
                  <dd className='font-medium text-gray-900'>{formatDob(patient.dateOfBirth)}</dd>
                </div>
                <div>
                  <dt className='text-gray-500'>Address</dt>
                  <dd className='font-medium text-gray-900'>{patient.address ?? '—'}</dd>
                </div>
              </dl>
            )
          }
        </div>

        <h2 className='text-lg font-semibold text-gray-900 mb-2'>
          Appointments ({patient.appointments.length})
        </h2>
        <div className='overflow-x-auto rounded-lg border border-gray-200 shadow-sm'>
          <div className='grid grid-cols-[1.4fr_1fr_120px] bg-gray-50'>
            <div className='px-4 py-3 text-sm font-semibold text-gray-700'>When</div>
            <div className='px-4 py-3 text-sm font-semibold text-gray-700'>Provider</div>
            <div className='px-4 py-3 text-sm font-semibold text-gray-700'>Status</div>
          </div>
          {patient.appointments.length !== 0
            ? patient.appointments.map((a) => (
              <div key={a.id} className='grid grid-cols-[1.4fr_1fr_120px] border-t border-gray-200'>
                <div className='px-4 py-3 text-sm text-gray-900'>
                  {new Date(a.startsAt).toLocaleString(undefined, {
                    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
                  })}
                  {a.notes && <div className='text-xs text-gray-500 italic truncate' title={a.notes}>“{a.notes}”</div>}
                </div>
                <div className='px-4 py-3 text-sm text-gray-700'>{a.provider.displayName ?? 'Provider'}</div>
                <div className='px-4 py-3 text-sm text-gray-700'>{a.status}</div>
              </div>
            ))
            : <div className='px-4 py-10 text-center text-gray-500'>No appointments yet</div>
          }
        </div>
      </div>
    </div>
  )
}
