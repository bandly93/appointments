import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Logo from '../../../shared/components/Logo'
import { getOfficeContact } from '../../booking/api/publicBookingApi'

export default function Contact() {
  const [contact, setContact] = useState<{
    officePhone: string | null
    officeEmail: string | null
    officeLocation: string | null
  } | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getOfficeContact()
      .then(setContact)
      .catch(() => setContact(null))
      .finally(() => setLoaded(true))
  }, [])

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
          <Logo to='/' />
          <Link
            to='/login'
            className='text-sm font-medium text-gray-500 hover:text-gray-900 transition'
          >
            Log in
          </Link>
        </header>

        <main className='flex flex-1 flex-col items-center justify-center px-6 py-16 text-center'>
          <h1 className='max-w-xl text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900'>
            Get in touch
          </h1>
          <p className='mt-3 max-w-md text-sm sm:text-base text-gray-500'>
            Questions about an appointment or your records? Reach the office directly, or use one of the
            options below.
          </p>

          <div className='mt-10 w-full max-w-sm rounded-xl border border-gray-100 bg-white p-6 shadow-sm text-left'>
            {!loaded ? (
              <p className='text-sm text-gray-400'>Loading contact details…</p>
            ) : !contact || (!contact.officePhone && !contact.officeEmail && !contact.officeLocation) ? (
              <p className='text-sm text-gray-400'>
                Contact details aren't available right now — please try again later.
              </p>
            ) : (
              <dl className='flex flex-col gap-4'>
                {contact.officePhone && (
                  <div>
                    <dt className='text-xs font-medium uppercase tracking-wide text-gray-400'>Phone</dt>
                    <dd className='mt-1 text-sm font-medium text-gray-900'>
                      <a href={`tel:${contact.officePhone}`} className='hover:text-blue-600 transition'>
                        {contact.officePhone}
                      </a>
                    </dd>
                  </div>
                )}
                {contact.officeEmail && (
                  <div>
                    <dt className='text-xs font-medium uppercase tracking-wide text-gray-400'>Email</dt>
                    <dd className='mt-1 text-sm font-medium text-gray-900'>
                      <a href={`mailto:${contact.officeEmail}`} className='hover:text-blue-600 transition'>
                        {contact.officeEmail}
                      </a>
                    </dd>
                  </div>
                )}
                {contact.officeLocation && (
                  <div>
                    <dt className='text-xs font-medium uppercase tracking-wide text-gray-400'>Location</dt>
                    <dd className='mt-1 text-sm font-medium text-gray-900'>{contact.officeLocation}</dd>
                  </div>
                )}
              </dl>
            )}
          </div>

          <div className='mt-8 flex flex-col items-center gap-3'>
            <Link
              to='/providers'
              className='rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-500'
            >
              Book an appointment
            </Link>
            <Link
              to='/request-documents'
              className='text-sm text-gray-500 hover:text-gray-900 transition'
            >
              Already a patient? Request your documents
            </Link>
            <Link to='/' className='text-sm text-gray-400 hover:text-gray-700 transition'>
              Back home
            </Link>
          </div>
        </main>
      </div>
    </div>
  )
}
