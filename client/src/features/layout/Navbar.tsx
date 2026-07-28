import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import Logo from '../../shared/components/Logo'
import { usePendingRequestCount } from '../bookingRequests/hooks/usePendingRequestCount'
import { usePendingDocumentRequestCount } from '../documents/hooks/usePendingDocumentRequestCount'

const navLinkClasses = (isActive: boolean) =>
  `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
  }`

const badgeClasses =
  'ml-1.5 inline-flex items-center justify-center rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-800'

function NavDivider() {
  return <span className='mx-1 h-5 w-px shrink-0 bg-gray-200' aria-hidden='true' />
}

const Navbar = () => {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const pendingCount = usePendingRequestCount()
  const pendingDocumentCount = usePendingDocumentRequestCount()

  return (
    <header className='flex items-center justify-between border-b border-gray-200 px-6 py-3'>
      <div className='flex items-center gap-6'>
        <Logo to='/dashboard' size='sm' />
        <nav className='flex items-center'>
          {/* Overview: where you land and where you look things up */}
          <div className='flex items-center gap-0.5'>
            <Link to='/dashboard' className={navLinkClasses(pathname === '/dashboard')}>
              Dashboard
            </Link>
            <Link to='/schedule' className={navLinkClasses(pathname === '/schedule')}>
              Schedule
            </Link>
            <Link to='/appointments' className={navLinkClasses(pathname === '/appointments')}>
              All Appointments
            </Link>
          </div>

          {(user?.role === 'STAFF' || user?.role === 'ADMIN' || user?.role === 'PROVIDER') && <NavDivider />}

          {/* Action inbox: things waiting on a decision */}
          <div className='flex items-center gap-0.5'>
            {(user?.role === 'STAFF' || user?.role === 'ADMIN' || user?.role === 'PROVIDER') && (
              <Link to='/booking-requests' className={navLinkClasses(pathname.startsWith('/booking-requests'))}>
                Booking Requests
                {pendingCount > 0 && <span className={badgeClasses}>{pendingCount}</span>}
              </Link>
            )}
            {(user?.role === 'STAFF' || user?.role === 'ADMIN') && (
              <Link to='/document-requests' className={navLinkClasses(pathname.startsWith('/document-requests'))}>
                Documents
                {pendingDocumentCount > 0 && <span className={badgeClasses}>{pendingDocumentCount}</span>}
              </Link>
            )}
          </div>

          <NavDivider />

          {/* Reference */}
          <Link to='/patients' className={navLinkClasses(pathname.startsWith('/patients'))}>
            Patients
          </Link>

          {/* Account-scoped settings, visually set apart from daily-operations tabs */}
          {(user?.role === 'PROVIDER' || user?.role === 'ADMIN') && (
            <>
              <NavDivider />
              {user?.role === 'PROVIDER' && (
                <Link to='/my-availability' className={navLinkClasses(pathname.startsWith('/my-availability'))}>
                  My Availability
                </Link>
              )}
              {user?.role === 'ADMIN' && (
                <Link to='/admin/users' className={navLinkClasses(pathname.startsWith('/admin/users'))}>
                  Users
                </Link>
              )}
            </>
          )}
        </nav>
      </div>
      <div className='flex items-center gap-3'>
        <span className='text-sm text-gray-600'>{user?.email}</span>
        <button
          onClick={() => {
            void logout()
          }}
          className='rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50'
        >
          Log out
        </button>
      </div>
    </header>
  )
}

export default Navbar
