import { Link } from 'react-router-dom'
import Logo from '../../../shared/components/Logo'

export default function Landing() {
  return (
    <div className='relative min-h-screen overflow-hidden bg-white'>
      <div
        className='pointer-events-none absolute inset-0'
        style={{
          background:
            'radial-gradient(50% 40% at 15% 10%, rgba(59,130,246,0.08), transparent 60%), ' +
            'radial-gradient(45% 35% at 90% 15%, rgba(59,130,246,0.06), transparent 60%)',
        }}
      />

      <div className='relative flex flex-col min-h-screen'>
        <header className='flex items-center justify-between px-6 py-5 sm:px-10'>
          <Logo to={null} />
          <Link
            to='/login'
            className='text-sm font-medium text-gray-500 hover:text-gray-900 transition'
          >
            Log in
          </Link>
        </header>

        <main className='flex flex-1 flex-col items-center justify-center px-6 py-16 text-center'>
          <h1 className='max-w-xl text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900'>
            Book an appointment in minutes
          </h1>
          <p className='mt-3 max-w-md text-sm sm:text-base text-gray-500'>
            Find a provider, see their open times, and request an appointment — no account needed.
          </p>

          <div className='mt-8 flex flex-col items-center gap-3'>
            <Link
              to='/providers'
              className='rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-500'
            >
              Find a provider
            </Link>
            <Link
              to='/login'
              className='text-sm text-gray-400 hover:text-gray-700 transition'
            >
              Staff or provider? Log in
            </Link>
          </div>
        </main>
      </div>
    </div>
  )
}
