import { useState } from 'react'

function EyeIcon() {
  return (
    <svg viewBox='0 0 20 20' fill='none' className='h-4 w-4' aria-hidden='true'>
      <path
        d='M1.5 10S4.5 4 10 4s8.5 6 8.5 6-3 6-8.5 6-8.5-6-8.5-6Z'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <circle cx='10' cy='10' r='2.25' stroke='currentColor' strokeWidth='1.5' />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg viewBox='0 0 20 20' fill='none' className='h-4 w-4' aria-hidden='true'>
      <path
        d='M2.5 2.5l15 15M8.36 8.36a2.25 2.25 0 0 0 3.28 3.28M6.13 6.16C3.6 7.72 1.5 10 1.5 10s3 6 8.5 6c1.56 0 2.87-.48 3.95-1.13M11.9 4.24C11.29 4.09 10.66 4 10 4c-.34 0-.66.02-.98.06M15.9 6.1C17.53 7.44 18.5 10 18.5 10s-.66 1.32-1.9 2.65'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export default function PasswordInput({
  id,
  value,
  onChange,
  required,
  minLength,
  autoComplete,
  placeholder,
  dense = false,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  minLength?: number
  autoComplete?: string
  placeholder?: string
  dense?: boolean
}) {
  const [revealed, setRevealed] = useState(false)

  return (
    <div className='relative'>
      <input
        id={id}
        type={revealed ? 'text' : 'password'}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-md border border-gray-300 pr-10 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          dense ? 'px-3 py-2' : 'px-3.5 py-2.5'
        }`}
      />
      <button
        type='button'
        onClick={() => setRevealed((r) => !r)}
        tabIndex={-1}
        aria-label={revealed ? 'Hide password' : 'Show password'}
        aria-pressed={revealed}
        className='absolute inset-y-0 right-0 flex w-10 items-center justify-center text-gray-400 hover:text-gray-600 transition-colors'
      >
        {revealed ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  )
}
