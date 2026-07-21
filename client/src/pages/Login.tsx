import { useState, type SubmitEvent } from 'react'
import { useAuth } from '../auth/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50 p-6'>
      <form
        onSubmit={handleSubmit}
        className='w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm'
      >
        <h1 className='mb-4 text-lg font-semibold text-gray-900'>Log in</h1>

        <div className='mb-3'>
          <label htmlFor='email' className='mb-1 block text-sm font-medium text-gray-700'>
            Email
          </label>
          <input
            id='email'
            type='email'
            required
            autoComplete='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none'
          />
        </div>

        <div className='mb-4'>
          <label htmlFor='password' className='mb-1 block text-sm font-medium text-gray-700'>
            Password
          </label>
          <input
            id='password'
            type='password'
            required
            autoComplete='current-password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none'
          />
        </div>

        {error && (
          <div className='mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>
            {error}
          </div>
        )}

        <button
          type='submit'
          disabled={isSubmitting}
          className='w-full rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50'
        >
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </div>
  )
}
