import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className='relative min-h-screen overflow-hidden bg-[#050e14]'>
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

      <div className='relative flex flex-col min-h-screen'>
        <header className='flex items-center justify-between px-6 py-5 sm:px-10'>
          <div className='flex items-center gap-2.5'>
            <div className='flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-gradient-to-br from-emerald-400 to-emerald-600 text-sm font-bold text-white shadow-lg shadow-emerald-500/40 ring-1 ring-white/20'>
              B
            </div>
            <span className='text-sm font-semibold tracking-tight text-white'>Bhealth</span>
          </div>
          <Link
            to='/login'
            className='text-sm font-medium text-white/60 hover:text-white transition'
          >
            Log in
          </Link>
        </header>

        <main className='flex flex-1 flex-col items-center justify-center px-6 py-16 text-center'>
          <h1 className='max-w-xl text-3xl sm:text-4xl font-semibold tracking-tight text-white'>
            Book an appointment in minutes
          </h1>
          <p className='mt-3 max-w-md text-sm sm:text-base text-white/60'>
            Find a provider, see their open times, and request an appointment — no account needed.
          </p>

          <div className='mt-8 flex flex-col items-center gap-3'>
            <Link
              to='/providers'
              className='rounded-lg bg-emerald-500 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400'
            >
              Find a provider
            </Link>
            <Link
              to='/login'
              className='text-sm text-white/50 hover:text-white/80 transition'
            >
              Staff or provider? Log in
            </Link>
          </div>
        </main>
      </div>
    </div>
  )
}
