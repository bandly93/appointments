import { Link } from 'react-router-dom'
import Logo from './Logo'

export default function PublicHeader() {
  return (
    <header className='flex items-center justify-between border-b border-gray-200 px-6 py-4'>
      <Logo />
      <Link to='/login' className='text-sm font-medium text-gray-500 hover:text-gray-900 transition'>
        Log in
      </Link>
    </header>
  )
}
