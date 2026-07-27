import { useState } from 'react'
import { Link } from 'react-router-dom'
import { requestDocuments } from '../api/publicDocumentsApi'
import { DOCUMENT_TYPES } from '../types/DocumentRequest'
import PublicHeader from '../../../shared/components/PublicHeader'

export default function RequestDocumentsPage() {
  const [email, setEmail] = useState('')
  const [documentType, setDocumentType] = useState<string>(DOCUMENT_TYPES[0])
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // The response never reveals whether a matching patient exists, so the
      // UI always shows the same confirmation regardless of what happened.
      await requestDocuments({ email, documentType, message: message.trim() || undefined })
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit your request')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <PublicHeader />
        <div className='w-full max-w-xl mx-auto p-6'>
          <div className='rounded-lg border border-green-200 bg-green-50 p-6'>
            <h1 className='text-xl font-semibold text-green-900 mb-2'>Check your email</h1>
            <p className='text-sm text-green-800'>
              If we found an account for that email, we've sent a confirmation link — tap it (or enter the code
              inside) to send your request to our team.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <PublicHeader />
      <div className='w-full max-w-xl mx-auto p-6'>
        <h1 className='text-2xl font-semibold text-gray-900 mb-1'>Request your documents</h1>
        <p className='text-sm text-gray-500 mb-4'>
          Already a patient? Tell us what you need and we'll follow up by email once you confirm.
        </p>

        <form onSubmit={handleSubmit}>
          <div className='mb-4'>
            <label htmlFor='doc-email' className='mb-1.5 block text-sm font-medium text-gray-700'>
              Email
            </label>
            <input
              id='doc-email'
              type='email'
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            />
          </div>

          <div className='mb-4'>
            <label htmlFor='doc-type' className='mb-1.5 block text-sm font-medium text-gray-700'>
              What do you need?
            </label>
            <select
              id='doc-type'
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            >
              {DOCUMENT_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className='mb-4'>
            <label htmlFor='doc-message' className='mb-1.5 block text-sm font-medium text-gray-700'>
              Details (optional)
            </label>
            <textarea
              id='doc-message'
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            />
          </div>

          {error && (
            <div className='mb-4 rounded-md bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm'>
              {error}
            </div>
          )}

          <div className='flex items-center justify-between gap-2'>
            <Link to='/' className='text-sm text-gray-500 hover:text-gray-700'>Back to home</Link>
            <button
              type='submit'
              disabled={isSubmitting}
              className='rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50'
            >
              {isSubmitting ? 'Submitting…' : 'Send request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
