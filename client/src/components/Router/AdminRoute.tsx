import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'

const AdminRoute = () => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  return user?.role === 'ADMIN' ? <Outlet /> : <Navigate to='/' replace />
}

export default AdminRoute
