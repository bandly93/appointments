import { Link } from 'react-router-dom'

export default function Logo({ to = '/', size = 'md' }: { to?: string | null; size?: 'sm' | 'md' }) {
  const iconSize = size === 'sm' ? 'h-7 w-7 text-xs' : 'h-8 w-8 text-sm'
  const textSize = size === 'sm' ? 'text-sm' : 'text-base'

  const content = (
    <div className='flex items-center gap-2.5'>
      <div
        className={`flex ${iconSize} items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 font-bold text-white shadow-sm`}
      >
        B
      </div>
      <span className={`${textSize} font-semibold tracking-tight text-gray-900`}>Bhealth</span>
    </div>
  )

  if (!to) return content

  return (
    <Link to={to} className='transition hover:opacity-80'>
      {content}
    </Link>
  )
}
