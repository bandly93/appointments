import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const navLinkClasses = (isActive: boolean) =>
  `rounded-md px-3 py-1.5 text-sm font-medium ${
    isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
  }`

const Navbar = () => {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()

  return (
    <header className='flex items-center justify-between border-b border-gray-200 px-6 py-3'>
      <div className='flex items-center gap-6'>
        <Link to='/' className='text-sm font-semibold text-gray-900'>
          Appointments
        </Link>
        <nav className='flex items-center gap-1'>
          <Link to='/' className={navLinkClasses(pathname === '/')}>
            Dashboard
          </Link>
          {user?.role === 'ADMIN' && (
            <Link to='/admin/users' className={navLinkClasses(pathname.startsWith('/admin/users'))}>
              Users
            </Link>
          )}
          {user?.role === 'PROVIDER' && (
            <Link to='/my-availability' className={navLinkClasses(pathname.startsWith('/my-availability'))}>
              My Availability
            </Link>
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
