import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProviders } from '../api/publicBookingApi'
import { type Provider } from '../types/Booking'
import PublicHeader from '../../../shared/components/PublicHeader'

export default function ProvidersList() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getProviders()
      .then(setProviders)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load providers'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className='min-h-screen bg-gray-50'>
      <PublicHeader />
      <div className='w-full max-w-2xl mx-auto p-6'>
        <h1 className='text-2xl font-semibold text-gray-900 mb-1'>Find a provider</h1>
        <p className='text-sm text-gray-500 mb-6'>Pick a provider to see their open times and request an appointment.</p>

        {error && (
          <div className='mb-4 rounded-md bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm'>
            {error}
          </div>
        )}

        {loading
          ? <div className='py-10 text-center text-gray-500'>Loading....</div>
          : providers.length === 0
            ? <div className='py-10 text-center text-gray-500'>No providers are currently accepting bookings</div>
            : (
              <div className='flex flex-col gap-2'>
                {providers.map((provider) => (
                  <Link
                    key={provider.id}
                    to={`/book/${provider.id}`}
                    className='flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm hover:border-blue-400 hover:shadow-md transition'
                  >
                    <span className='text-sm font-medium text-gray-900'>{provider.displayName ?? 'Provider'}</span>
                    <span className='text-sm text-blue-600'>Book →</span>
                  </Link>
                ))}
              </div>
            )
        }
      </div>
    </div>
  )
}
