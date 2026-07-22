import { Navigate, Route, Routes } from "react-router-dom"
import Login from "../features/auth/Login"
import Dashboard from "../features/appointments/pages/Dashboard"
import Users from "../features/users/pages/Users"
import ProtectedRoute from "../features/auth/components/ProtectedRoute"
import AdminRoute from "../features/auth/components/AdminRoute"
import RoleRoute from "../features/auth/components/RoleRoute"
import BookingRequests from "../features/bookingRequests/pages/BookingRequests"
import AvailabilityManager from "../features/availability/pages/AvailabilityManager"
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
          <Route path='/admin/users' element={<Users />} />
        </Route>
        <Route element={<RoleRoute roles={['STAFF', 'ADMIN']} />}>
          <Route path='/booking-requests' element={<BookingRequests />} />
        </Route>
        <Route element={<RoleRoute roles={['PROVIDER']} />}>
          <Route path='/my-availability' element={<AvailabilityManager />} />
        </Route>
      </Route>
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  )
}

export default App
