import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { getProviders, getSlots } from '../../booking/api/publicBookingApi'
import { createPhoneBooking } from '../api/bookingRequestsApi'
import { type Provider, type Slot } from '../../booking/types/Booking'
import Modal from '../../../shared/components/Modal'

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function PhoneBookingModal({ onClose, onBooked }: { onClose: () => void; onBooked: () => void }) {
  const { authFetch, user } = useAuth()

  const [providers, setProviders] = useState<Provider[]>([])
  const [providerId, setProviderId] = useState('')
  const [date, setDate] = useState(todayDateString())
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedSlot) {
      setError('Pick a time slot')
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      const booked = await createPhoneBooking(authFetch, {
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
    <Modal title='Book by phone' onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className='mb-4'>
          <label htmlFor='phone-booking-provider' className='mb-1.5 block text-sm font-medium text-gray-700'>
            Provider
          </label>
          <select
            id='phone-booking-provider'
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
          <label htmlFor='phone-booking-date' className='mb-1.5 block text-sm font-medium text-gray-700'>
            Date
          </label>
          <input
            id='phone-booking-date'
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
          <label htmlFor='phone-booking-name' className='mb-1.5 block text-sm font-medium text-gray-700'>
            Patient name
          </label>
          <input
            id='phone-booking-name'
            type='text'
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          />
        </div>

        <div className='mb-4'>
          <label htmlFor='phone-booking-email' className='mb-1.5 block text-sm font-medium text-gray-700'>
            Email
          </label>
          <input
            id='phone-booking-email'
            type='email'
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          />
        </div>

        <div className='mb-4'>
          <label htmlFor='phone-booking-phone' className='mb-1.5 block text-sm font-medium text-gray-700'>
            Phone (optional)
          </label>
          <input
            id='phone-booking-phone'
            type='tel'
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          />
        </div>

        <div className='mb-4'>
          <label htmlFor='phone-booking-notes' className='mb-1.5 block text-sm font-medium text-gray-700'>
            Notes (optional)
          </label>
          <textarea
            id='phone-booking-notes'
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
