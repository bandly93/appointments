import { Navigate, Route, Routes } from "react-router-dom"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import ProtectedRoute from "./components/Router/ProtectedRoutes"
import { useAuth } from "./auth/AuthContext"

function App() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route
        path='/login'
        element={isAuthenticated ? <Navigate to='/' replace /> : <Login />}
      />
      <Route element={<ProtectedRoute />}>
        <Route path='/' element={<Dashboard />} />
      </Route>
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  )
}

export default App
