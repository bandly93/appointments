import { useState } from 'react'
import { verifyBookingRequest, resendVerificationCode } from '../api/publicBookingApi'
import { type MyBookingRequest } from '../types/Booking'

export default function VerifyCodeForm({
  bookingId,
  token,
  onVerified,
}: {
  bookingId: string
  token: string
  onVerified: (bookingRequest: MyBookingRequest) => void
}) {
  const [code, setCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resent, setResent] = useState(false)

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const bookingRequest = await verifyBookingRequest(bookingId, token, code)
      onVerified(bookingRequest)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify code')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleResend() {
    setIsResending(true)
    setError(null)
    setResent(false)

    try {
      await resendVerificationCode(bookingId, token)
      setResent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className='rounded-lg border border-blue-200 bg-blue-50 p-6'>
      <h2 className='text-lg font-semibold text-blue-900 mb-1'>Confirm your email</h2>
      <p className='text-sm text-blue-800 mb-4'>
        We sent a 6-digit code to your email. Enter it below to hold your appointment request — the code expires in 10 minutes.
      </p>

      <form onSubmit={handleSubmit} className='flex flex-col gap-3'>
        <input
          type='text'
          inputMode='numeric'
          pattern='[0-9]*'
          maxLength={6}
          required
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder='123456'
          className='w-full rounded-md border border-gray-300 px-3 py-2 text-lg tracking-[0.3em] text-center shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
        />

        {error && (
          <div className='rounded-md bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm'>
            {error}
          </div>
        )}

        {resent && !error && (
          <div className='rounded-md bg-green-50 border border-green-200 text-green-700 px-3 py-2 text-sm'>
            A new code has been sent
          </div>
        )}

        <div className='flex items-center justify-between gap-2'>
          <button
            type='button'
            onClick={handleResend}
            disabled={isResending}
            className='text-sm text-blue-700 hover:text-blue-900 disabled:opacity-50'
          >
            {isResending ? 'Sending…' : 'Resend code'}
          </button>
          <button
            type='submit'
            disabled={isSubmitting || code.length !== 6}
            className='rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {isSubmitting ? 'Verifying…' : 'Confirm'}
          </button>
        </div>
      </form>
    </div>
  )
}
