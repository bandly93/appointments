import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../AuthContext'

type Props = {
  roles: string[]
}

const RoleRoute = ({ roles }: Props) => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  return user && roles.includes(user.role) ? <Outlet /> : <Navigate to='/dashboard' replace />
}

export default RoleRoute
