import { Link } from "react-router-dom"
import AppointmentsTable from "../components/Table"
import ActivityFeed from "../components/ActivityFeed"
import StatusToast from "../components/StatusToast"
import { useAuth } from "../../auth/AuthContext"

export default function Dashboard() {
  const { user, logout } = useAuth()

  return (
    <div className='flex flex-col'>
      <header className='flex items-center justify-between border-b border-gray-200 px-6 py-3'>
        <span className='text-sm text-gray-600'>{user?.email}</span>
        <div className='flex items-center gap-3'>
          {user?.role === 'ADMIN' && (
            <Link
              to='/admin/users'
              className='rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50'
            >
              Manage users
            </Link>
          )}
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
      <div className='flex flex-col lg:flex-row gap-6 p-6'>
        <ActivityFeed />
        <AppointmentsTable />
        <StatusToast />
      </div>
    </div>
  )
}
