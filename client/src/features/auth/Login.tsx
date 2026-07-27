import { useState, type SubmitEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './AuthContext'
import Logo from '../../shared/components/Logo'

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
      <div className='w-full max-w-sm'>
        <div className='mb-8 flex flex-col items-center'>
          <Link to='/'>
            <Logo to={null} />
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className='w-full rounded-2xl border border-gray-200 bg-white p-8 shadow-sm'
        >
          <h1 className='mb-1 text-xl font-semibold text-gray-900'>Welcome back</h1>
          <p className='mb-6 text-sm text-gray-500'>Log in to your account to continue</p>

          <div className='mb-4'>
            <label htmlFor='email' className='mb-1.5 block text-sm font-medium text-gray-700'>
              Email
            </label>
            <input
              id='email'
              type='email'
              required
              autoComplete='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='you@example.com'
              className='w-full rounded-md border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            />
          </div>

          <div className='mb-5'>
            <label htmlFor='password' className='mb-1.5 block text-sm font-medium text-gray-700'>
              Password
            </label>
            <input
              id='password'
              type='password'
              required
              autoComplete='current-password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='••••••••'
              className='w-full rounded-md border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            />
          </div>

          {error && (
            <div className='mb-5 rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700'>
              {error}
            </div>
          )}

          <button
            type='submit'
            disabled={isSubmitting}
            className='w-full rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {isSubmitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className='mt-6 text-center text-sm text-gray-500'>
          <Link to='/' className='hover:text-gray-700 transition'>
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  )
}
