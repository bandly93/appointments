import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../AuthContext'

const AdminRoute = () => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  return user?.role === 'ADMIN' ? <Outlet /> : <Navigate to='/dashboard' replace />
}

export default AdminRoute
