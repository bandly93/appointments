import { useState, type SubmitEvent } from 'react'
import { useAuth } from './AuthContext'

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
    <div className='relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050e14] p-6'>
      <div
        className='pointer-events-none absolute inset-0'
        style={{
          background:
            'radial-gradient(60% 50% at 20% 15%, rgba(16,185,129,0.35), transparent 60%), ' +
            'radial-gradient(50% 45% at 85% 20%, rgba(56,189,248,0.22), transparent 60%), ' +
            'radial-gradient(70% 60% at 50% 100%, rgba(16,185,129,0.18), transparent 60%), ' +
            'linear-gradient(160deg, #071019 0%, #0a1a1f 45%, #050b12 100%)',
        }}
      />
      <div
        className='pointer-events-none absolute inset-0 opacity-[0.04]'
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27120%27 height=%27120%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%272%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27/%3E%3C/svg%3E")',
        }}
      />

      <div className='relative w-full max-w-sm'>
        <div className='mb-8 flex flex-col items-center gap-3'>
          <div className='flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-400 to-emerald-600 text-lg font-bold text-white shadow-lg shadow-emerald-500/40 ring-1 ring-white/20'>
            B
          </div>
          <span className='bg-gradient-to-b from-white to-white/70 bg-clip-text text-2xl font-semibold tracking-tight text-transparent'>
            Bhealth
          </span>
        </div>

        <form
          onSubmit={handleSubmit}
          className='w-full rounded-2xl border border-white/10 bg-white/[0.06] p-8 shadow-2xl shadow-black/40 backdrop-blur-xl'
        >
          <h1 className='mb-1 text-xl font-semibold text-white'>Welcome back</h1>
          <p className='mb-6 text-sm text-white/50'>Log in to your account to continue</p>

          <div className='mb-4'>
            <label htmlFor='email' className='mb-1.5 block text-sm font-medium text-white/70'>
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
              className='w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20'
            />
          </div>

          <div className='mb-5'>
            <label htmlFor='password' className='mb-1.5 block text-sm font-medium text-white/70'>
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
              className='w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20'
            />
          </div>

          {error && (
            <div className='mb-5 rounded-lg border border-red-400/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300'>
              {error}
            </div>
          )}

          <button
            type='submit'
            disabled={isSubmitting}
            className='w-full rounded-lg bg-emerald-500 px-3.5 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {isSubmitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  )
}
