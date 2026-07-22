import { Navigate, Route, Routes } from "react-router-dom"
import Login from "../features/auth/Login"
import Dashboard from "../features/appointments/pages/Dashboard"
import AdminUsers from "../features/admin-users/pages/AdminUsers"
import ProtectedRoute from "../features/auth/components/ProtectedRoute"
import AdminRoute from "../features/auth/components/AdminRoute"
import { useAuth } from "../features/auth/AuthContext"

function App() {
  const { isAuthenticated, isLoading } = useAuth()

  return (
    <Routes>
      <Route
        path='/login'
        element={isLoading ? null : isAuthenticated ? <Navigate to='/' replace /> : <Login />}
      />
      <Route element={<ProtectedRoute />}>
        <Route path='/' element={<Dashboard />} />
        <Route element={<AdminRoute />}>
          <Route path='/admin/users' element={<AdminUsers />} />
        </Route>
      </Route>
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  )
}

export default App
