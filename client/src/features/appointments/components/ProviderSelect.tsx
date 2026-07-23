import { useEffect, useState } from 'react'
import { getProviders } from '../../booking/api/publicBookingApi'
import { type Provider } from '../../booking/types/Booking'

export default function ProviderSelect({
  value,
  onChange,
}: {
  value: string | 'All'
  onChange: (value: string | 'All') => void
}) {
  const [providers, setProviders] = useState<Provider[]>([])

  useEffect(() => {
    getProviders().then(setProviders).catch(() => setProviders([]))
  }, [])

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className='rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
    >
      <option value='All'>All providers</option>
      {providers.map((p) => (
        <option key={p.id} value={p.id}>{p.displayName ?? 'Provider'}</option>
      ))}
    </select>
  )
}
