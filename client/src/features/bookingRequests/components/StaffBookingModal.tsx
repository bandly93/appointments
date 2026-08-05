import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { getProviders, getSlots } from '../../booking/api/publicBookingApi'
import { type Provider, type Slot } from '../../booking/types/Booking'
import Modal from '../../../shared/components/Modal'

function todayDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function StaffBookingModal({
  onClose,
  onSlotChosen,
}: {
  onClose: () => void
  onSlotChosen: (providerId: string, slot: Slot) => void
}) {
  const { user } = useAuth()

  const [providers, setProviders] = useState<Provider[]>([])
  const [providerId, setProviderId] = useState('')
  const [date, setDate] = useState(todayDateString())
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

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
    getSlots(providerId, date, date)
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [providerId, date])

  return (
    <Modal title='New booking' onClose={onClose}>
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

      <div className='mb-2'>
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
                      onClick={() => onSlotChosen(providerId, slot)}
                      className='rounded-md border px-3 py-2 text-sm transition-colors border-gray-300 bg-white text-gray-700 hover:border-blue-500 hover:text-blue-700'
                    >
                      {new Date(slot.startsAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                    </button>
                  ))}
                </div>
              )
        }
      </div>
    </Modal>
  )
}
