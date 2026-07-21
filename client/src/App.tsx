import { Navigate, Route, Routes } from "react-router-dom"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import AdminUsers from "./pages/AdminUsers"
import ProtectedRoute from "./components/Router/ProtectedRoutes"
import AdminRoute from "./components/Router/AdminRoute"
import { useAuth } from "./auth/AuthContext"

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
