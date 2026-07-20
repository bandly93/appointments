import { useState } from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  return (
    <Routes>
      <Route
        path='/login'
        element={
          isLoggedIn ? (
            <Navigate to='/' replace />
          ) : (
            <Login onSuccess={() => setIsLoggedIn(true)} />
          )
        }
      />
      <Route
        path='/'
        element={isLoggedIn ? <Dashboard /> : <Navigate to='/login' replace />}
      />
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  )
}

export default App
