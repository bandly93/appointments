import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { getProviders, getSlots } from '../../booking/api/publicBookingApi'
import { createStaffBooking } from '../api/bookingRequestsApi'
import { getPatients } from '../../patients/api/patientsApi'
import { type Provider, type Slot } from '../../booking/types/Booking'
import { type Patient } from '../../patients/types/Patient'
import { useDebounce } from '../../../shared/hooks/useDebounce'
import Modal from '../../../shared/components/Modal'

function todayDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function StaffBookingModal({ onClose, onBooked }: { onClose: () => void; onBooked: () => void }) {
  const { authFetch, user } = useAuth()

  const [providers, setProviders] = useState<Provider[]>([])
  const [providerId, setProviderId] = useState('')
  const [date, setDate] = useState(todayDateString())
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)

  const [patientQuery, setPatientQuery] = useState('')
  const debouncedPatientQuery = useDebounce(patientQuery, 300)
  const [patientResults, setPatientResults] = useState<Patient[]>([])
  const [searchingPatients, setSearchingPatients] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ emailSent: boolean } | null>(null)

  useEffect(() => {
    getProviders()
      .then((list) => {
        setProviders(list)
        // Providers can only book on their own schedule — pick it for them.
        if (user?.role === 'PROVIDER') setProviderId(user.id)
        else if (list.length === 1) setProviderId(list[0].id)
      })
      .catch(() => setProviders([]))
  }, [user])

  useEffect(() => {
    if (!providerId) {
      setSlots([])
      return
    }
    setLoadingSlots(true)
    setSelectedSlot(null)
    getSlots(providerId, date, date)
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [providerId, date])

  useEffect(() => {
    if (selectedPatient || debouncedPatientQuery.trim().length < 2) {
      setPatientResults([])
      return
    }
    setSearchingPatients(true)
    getPatients(authFetch, debouncedPatientQuery.trim())
      .then(setPatientResults)
      .catch(() => setPatientResults([]))
      .finally(() => setSearchingPatients(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedPatientQuery, selectedPatient])

  const debouncedEmail = useDebounce(email, 400)
  const [emailMatch, setEmailMatch] = useState<Patient | null>(null)

  // Manual entry can collide with an existing patient's email without staff
  // ever searching for them — booking would silently overwrite that
  // patient's name/phone/DOB/address (identity is resolved by email
  // server-side). Surface the match so staff can pick the right record
  // instead of clobbering it.
  useEffect(() => {
    const candidate = debouncedEmail.trim().toLowerCase()
    if (selectedPatient || !candidate || !candidate.includes('@')) {
      setEmailMatch(null)
      return
    }
    let cancelled = false
    getPatients(authFetch, candidate)
      .then((results) => {
        if (cancelled) return
        setEmailMatch(results.find((p) => p.email.toLowerCase() === candidate) ?? null)
      })
      .catch(() => {
        if (!cancelled) setEmailMatch(null)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedEmail, selectedPatient])

  function selectPatient(patient: Patient) {
    setEmailMatch(null)
    setSelectedPatient(patient)
    setPatientQuery('')
    setPatientResults([])
    setName(patient.name)
    setEmail(patient.email)
    setPhone(patient.phone ?? '')
  }

  function clearSelectedPatient() {
    setSelectedPatient(null)
    setName('')
    setEmail('')
    setPhone('')
  }

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedSlot) {
      setError('Pick a time slot')
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      const booked = await createStaffBooking(authFetch, {
        providerId,
        startsAt: selectedSlot.startsAt,
        notes: notes.trim() || undefined,
        patient: { name, email, phone: phone.trim() || undefined },
      })
      setResult(booked)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (result) {
    return (
      <Modal title='Booked' onClose={onBooked}>
        <div className='text-center py-4'>
          <p className='text-sm text-gray-900 font-medium mb-1'>Appointment confirmed.</p>
          <p className='text-sm text-gray-600 mb-4'>
            {result.emailSent
              ? "A confirmation email with their booking link was sent."
              : "We couldn't send the confirmation email — let the patient know the details directly."}
          </p>
          <button
            type='button'
            onClick={onBooked}
            className='rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500'
          >
            Done
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title='New booking' onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className='mb-4'>
          <label htmlFor='staff-booking-provider' className='mb-1.5 block text-sm font-medium text-gray-700'>
            Provider
          </label>
          <select
            id='staff-booking-provider'
            required
            value={providerId}
            disabled={user?.role === 'PROVIDER'}
            onChange={(e) => setProviderId(e.target.value)}
            className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100'
          >
            <option value='' disabled>Select a provider</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>{p.displayName ?? 'Provider'}</option>
            ))}
          </select>
        </div>

        <div className='mb-4'>
          <label htmlFor='staff-booking-date' className='mb-1.5 block text-sm font-medium text-gray-700'>
            Date
          </label>
          <input
            id='staff-booking-date'
            type='date'
            value={date}
            min={todayDateString()}
            onChange={(e) => setDate(e.target.value)}
            className='rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          />
        </div>

        <div className='mb-4'>
          <span className='mb-1.5 block text-sm font-medium text-gray-700'>Time</span>
          {!providerId
            ? <p className='text-sm text-gray-500'>Pick a provider first</p>
            : loadingSlots
              ? <p className='text-sm text-gray-500'>Loading…</p>
              : slots.length === 0
                ? <p className='text-sm text-gray-500'>No open slots on this date</p>
                : (
                  <div className='grid grid-cols-3 sm:grid-cols-4 gap-2'>
                    {slots.map((slot) => (
                      <button
                        key={slot.startsAt}
                        type='button'
                        onClick={() => setSelectedSlot(slot)}
                        className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                          selectedSlot?.startsAt === slot.startsAt
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-blue-500 hover:text-blue-700'
                        }`}
                      >
                        {new Date(slot.startsAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                      </button>
                    ))}
                  </div>
                )
          }
        </div>

        <div className='mb-4'>
          <span className='mb-1.5 block text-sm font-medium text-gray-700'>Patient</span>

          {selectedPatient
            ? (
              <div className='flex items-center justify-between rounded-md border border-blue-200 bg-blue-50 px-3 py-2'>
                <div className='text-sm'>
                  <span className='font-medium text-gray-900'>{selectedPatient.name}</span>
                  <span className='text-gray-500'> — {selectedPatient.email}</span>
                </div>
                <button
                  type='button'
                  onClick={clearSelectedPatient}
                  className='text-xs font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap'
                >
                  Not them? Search again
                </button>
              </div>
            )
            : (
              <div className='relative'>
                <input
                  type='text'
                  placeholder='Search existing patients by name, email, or phone…'
                  value={patientQuery}
                  onChange={(e) => setPatientQuery(e.target.value)}
                  className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                />
                {(searchingPatients || patientResults.length > 0) && (
                  <div className='absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-48 overflow-y-auto'>
                    {searchingPatients
                      ? <div className='px-3 py-2 text-sm text-gray-500'>Searching…</div>
                      : patientResults.map((p) => (
                        <button
                          key={p.id}
                          type='button'
                          onClick={() => selectPatient(p)}
                          className='block w-full text-left px-3 py-2 text-sm hover:bg-gray-50'
                        >
                          <div className='text-gray-900 font-medium'>{p.name}</div>
                          <div className='text-gray-500 text-xs'>
                            {p.email}{p.phone ? ` · ${p.phone}` : ''}
                          </div>
                        </button>
                      ))
                    }
                  </div>
                )}
                <p className='mt-1.5 text-xs text-gray-500'>
                  No match? Fill in the fields below to book a new patient.
                </p>
              </div>
            )
          }
        </div>

        <div className='mb-4'>
          <label htmlFor='staff-booking-name' className='mb-1.5 block text-sm font-medium text-gray-700'>
            Patient name
          </label>
          <input
            id='staff-booking-name'
            type='text'
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          />
        </div>

        <div className='mb-4'>
          <label htmlFor='staff-booking-email' className='mb-1.5 block text-sm font-medium text-gray-700'>
            Email
          </label>
          <input
            id='staff-booking-email'
            type='email'
            required
            value={email}
            disabled={!!selectedPatient}
            onChange={(e) => setEmail(e.target.value)}
            className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100'
          />
          {selectedPatient && (
            <p className='mt-1.5 text-xs text-gray-500'>
              Email is locked to the selected patient. Use "Not them? Search again" to change it.
            </p>
          )}
          {emailMatch && (
            <div className='mt-1.5 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800'>
              This email already belongs to <span className='font-medium'>{emailMatch.name}</span>. Continuing will
              overwrite their saved details with what's entered above.{' '}
              <button
                type='button'
                onClick={() => selectPatient(emailMatch)}
                className='font-medium underline hover:text-amber-900'
              >
                Use this patient instead
              </button>
            </div>
          )}
        </div>

        <div className='mb-4'>
          <label htmlFor='staff-booking-phone' className='mb-1.5 block text-sm font-medium text-gray-700'>
            Phone (optional)
          </label>
          <input
            id='staff-booking-phone'
            type='tel'
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          />
        </div>

        <div className='mb-4'>
          <label htmlFor='staff-booking-notes' className='mb-1.5 block text-sm font-medium text-gray-700'>
            Notes (optional)
          </label>
          <textarea
            id='staff-booking-notes'
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          />
        </div>

        {error && (
          <div className='mb-4 rounded-md bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm'>
            {error}
          </div>
        )}

        <div className='flex justify-end gap-2'>
          <button
            type='button'
            onClick={onClose}
            className='rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50'
          >
            Cancel
          </button>
          <button
            type='submit'
            disabled={isSubmitting}
            className='rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {isSubmitting ? 'Booking…' : 'Confirm booking'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
