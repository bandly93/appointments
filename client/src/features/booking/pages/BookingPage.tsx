import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getProvider, getSlots, createBookingRequest, resendVerificationEmail } from '../api/publicBookingApi'
import { type Slot, type Provider } from '../types/Booking'
import Modal from '../../../shared/components/Modal'
import PublicHeader from '../../../shared/components/PublicHeader'

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

const SLOT_PERIODS = [
  { label: 'Morning', test: (h: number) => h < 12 },
  { label: 'Afternoon', test: (h: number) => h >= 12 && h < 17 },
  { label: 'Evening', test: (h: number) => h >= 17 },
] as const

function SlotPicker({ slots, onSelect }: { slots: Slot[]; onSelect: (slot: Slot) => void }) {
  const groups = SLOT_PERIODS
    .map((period) => ({
      label: period.label,
      slots: slots.filter((s) => period.test(new Date(s.startsAt).getHours())),
    }))
    .filter((group) => group.slots.length > 0)

  return (
    <div className='flex flex-col gap-5'>
      {groups.map((group) => (
        <div key={group.label}>
          <h2 className='text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2'>{group.label}</h2>
          <div className='grid grid-cols-3 sm:grid-cols-4 gap-2'>
            {group.slots.map((slot) => (
              <button
                key={slot.startsAt}
                type='button'
                onClick={() => onSelect(slot)}
                className='rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:border-blue-500 hover:text-blue-700 transition-colors'
              >
                {new Date(slot.startsAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function BookingPage() {
  const { providerId } = useParams<{ providerId: string }>()
  const [provider, setProvider] = useState<Provider | undefined>(undefined)
  const [date, setDate] = useState(todayDateString())
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [booking, setBooking] = useState<{ id: string; accessToken: string; emailSent: boolean; email: string } | null>(null)

  useEffect(() => {
    if (!providerId) return
    getProvider(providerId).then(setProvider).catch(() => setProvider(undefined))
  }, [providerId])

  useEffect(() => {
    if (!providerId) return

    setLoading(true)
    setError(null)
    getSlots(providerId, date, date)
      .then(setSlots)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load availability'))
      .finally(() => setLoading(false))
  }, [providerId, date])

  if (!providerId) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <PublicHeader />
        <div className='p-6 text-center text-gray-500'>Provider not found</div>
      </div>
    )
  }

  if (booking) {
    const link = `${window.location.origin}/my-booking/${booking.id}?token=${booking.accessToken}`
    return (
      <div className='min-h-screen bg-gray-50'>
        <PublicHeader />
        <div className='w-full max-w-xl mx-auto p-6 flex flex-col gap-4'>
          {booking.emailSent
            ? (
              <div className='rounded-lg border border-gray-200 bg-white shadow-sm p-6 text-center'>
                <h1 className='text-xl font-semibold text-gray-900 mb-2'>Check your email</h1>
                <p className='text-sm text-gray-600'>
                  We've sent a link to <span className='font-medium text-gray-900'>{booking.email}</span> to confirm
                  your request. Tap it and we'll take it from there — you don't need to keep this tab open. That
                  email is also how you'll find your way back to check on it later.
                </p>
              </div>
            )
            : (
              <div className='rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800'>
                We couldn't email that confirmation to you. Try resending it below, or contact the office directly
                to confirm your request.
              </div>
            )
          }

          <ResendEmailAction bookingId={booking.id} token={booking.accessToken} />

          {!booking.emailSent && (
            <SaveLinkBox
              link={link}
              message="In the meantime, here's your link directly — save it so you don't lose access to this request."
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <PublicHeader />
      <div className='w-full max-w-3xl mx-auto p-6'>
        <h1 className='text-2xl font-semibold text-gray-900 mb-1'>
          Book with {provider?.displayName ?? 'this provider'}
        </h1>
        <p className='text-sm text-gray-500 mb-4'>Pick a date and an open time slot.</p>

        <div className='mb-4'>
          <label htmlFor='booking-date' className='mb-1.5 block text-sm font-medium text-gray-700'>
            Date
          </label>
          <input
            id='booking-date'
            type='date'
            value={date}
            min={todayDateString()}
            onChange={(e) => setDate(e.target.value)}
            className='rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          />
        </div>

        {error && (
          <div className='mb-4 rounded-md bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm'>
            {error}
          </div>
        )}

        {loading
          ? <div className='py-10 text-center text-gray-500'>Loading....</div>
          : slots.length === 0
            ? (
              <div className='py-10 text-center'>
                <p className='text-gray-500 mb-3'>No open slots on this date</p>
                <button
                  type='button'
                  onClick={() => {
                    const next = new Date(`${date}T00:00:00`)
                    next.setDate(next.getDate() + 1)
                    setDate(next.toISOString().slice(0, 10))
                  }}
                  className='rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50'
                >
                  Try the next day →
                </button>
              </div>
            )
            : <SlotPicker slots={slots} onSelect={setSelectedSlot} />
        }

        {selectedSlot && (
          <BookingFormModal
            providerId={providerId}
            slot={selectedSlot}
            onClose={() => setSelectedSlot(null)}
            onBooked={(result) => {
              setBooking(result)
              setSelectedSlot(null)
            }}
          />
        )}
      </div>
    </div>
  )
}

function SaveLinkBox({ link, message }: { link: string; message: string }) {
  return (
    <div className='rounded-lg border border-amber-200 bg-amber-50 p-6'>
      <p className='text-sm mb-4 text-amber-800'>{message}</p>
      <div className='flex items-center gap-2'>
        <input
          readOnly
          value={link}
          className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white'
          onFocus={(e) => e.target.select()}
        />
        <button
          type='button'
          onClick={() => navigator.clipboard.writeText(link)}
          className='rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 whitespace-nowrap'
        >
          Copy link
        </button>
      </div>
    </div>
  )
}

function ResendEmailAction({ bookingId, token }: { bookingId: string; token: string }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleResend() {
    setStatus('sending')
    try {
      await resendVerificationEmail(bookingId, token)
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className='flex items-center gap-2 text-sm'>
      <button
        type='button'
        onClick={() => void handleResend()}
        disabled={status === 'sending'}
        className='font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50'
      >
        {status === 'sending' ? 'Sending…' : "Didn't get it? Resend the email"}
      </button>
      {status === 'sent' && <span className='text-green-700'>Sent — check your inbox.</span>}
      {status === 'error' && <span className='text-red-700'>Couldn't resend. Try again shortly.</span>}
    </div>
  )
}

function BookingFormModal({
  providerId,
  slot,
  onClose,
  onBooked,
}: {
  providerId: string
  slot: Slot
  onClose: () => void
  onBooked: (result: { id: string; accessToken: string; emailSent: boolean; email: string }) => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await createBookingRequest({
        providerId,
        startsAt: slot.startsAt,
        notes: notes.trim() || undefined,
        patient: {
          name,
          email,
          phone: phone.trim() || undefined,
          dateOfBirth: dateOfBirth || undefined,
          address: address.trim() || undefined,
        },
      })
      onBooked({ ...result, email })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit booking request')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal title='Request appointment' onClose={onClose}>
      <p className='mb-4 text-sm text-gray-600'>
        {new Date(slot.startsAt).toLocaleString(undefined, {
          weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
        })}
      </p>
      <form onSubmit={handleSubmit}>
        <div className='mb-4'>
          <label htmlFor='patient-name' className='mb-1.5 block text-sm font-medium text-gray-700'>
            Full name
          </label>
          <input
            id='patient-name'
            type='text'
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          />
        </div>

        <div className='mb-4'>
          <label htmlFor='patient-email' className='mb-1.5 block text-sm font-medium text-gray-700'>
            Email
          </label>
          <input
            id='patient-email'
            type='email'
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          />
        </div>

        <div className='mb-4'>
          <label htmlFor='patient-phone' className='mb-1.5 block text-sm font-medium text-gray-700'>
            Phone (optional)
          </label>
          <input
            id='patient-phone'
            type='tel'
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          />
        </div>

        <div className='mb-4'>
          <label htmlFor='patient-dob' className='mb-1.5 block text-sm font-medium text-gray-700'>
            Date of birth (optional)
          </label>
          <input
            id='patient-dob'
            type='date'
            value={dateOfBirth}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          />
        </div>

        <div className='mb-4'>
          <label htmlFor='patient-address' className='mb-1.5 block text-sm font-medium text-gray-700'>
            Address (optional)
          </label>
          <input
            id='patient-address'
            type='text'
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          />
        </div>

        <div className='mb-4'>
          <label htmlFor='patient-notes' className='mb-1.5 block text-sm font-medium text-gray-700'>
            Notes (optional)
          </label>
          <textarea
            id='patient-notes'
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
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
            {isSubmitting ? 'Submitting…' : 'Request appointment'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
