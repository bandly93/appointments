import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'

const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth()

  return isAuthenticated ? <Outlet /> : <Navigate to='/login' replace />
}

export default ProtectedRoute
