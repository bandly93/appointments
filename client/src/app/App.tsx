import { Navigate, Route, Routes } from "react-router-dom"
import Login from "../features/auth/Login"
import Dashboard from "../features/appointments/pages/Dashboard"
import AllAppointments from "../features/appointments/pages/AllAppointments"
import Schedule from "../features/schedule/pages/Schedule"
import Patients from "../features/patients/pages/Patients"
import PatientDetail from "../features/patients/pages/PatientDetail"
import DocumentRequests from "../features/documents/pages/DocumentRequests"
import Users from "../features/users/pages/Users"
import ProtectedRoute from "../features/auth/components/ProtectedRoute"
import AdminRoute from "../features/auth/components/AdminRoute"
import RoleRoute from "../features/auth/components/RoleRoute"
import Landing from "../features/landing/pages/Landing"
import Contact from "../features/landing/pages/Contact"
import BookingPage from "../features/booking/pages/BookingPage"
import MyBookingPage from "../features/booking/pages/MyBookingPage"
import ProvidersList from "../features/booking/pages/ProvidersList"
import RequestDocumentsPage from "../features/documents/pages/RequestDocumentsPage"
import MyDocumentsPage from "../features/documents/pages/MyDocumentsPage"
import BookingRequests from "../features/bookingRequests/pages/BookingRequests"
import AvailabilityManager from "../features/availability/pages/AvailabilityManager"
import { useAuth } from "../features/auth/AuthContext"

function App() {
  const { isAuthenticated, isLoading } = useAuth()

  return (
    <Routes>
      <Route
        path='/'
        element={isLoading ? null : isAuthenticated ? <Navigate to='/dashboard' replace /> : <Landing />}
      />
      <Route
        path='/login'
        element={isLoading ? null : isAuthenticated ? <Navigate to='/dashboard' replace /> : <Login />}
      />
      {/* public routes */}
      <Route path='/contact' element={<Contact />} />
      <Route path='/providers' element={<ProvidersList />} />
      <Route path='/book/:providerId' element={<BookingPage />} />
      <Route path='/my-booking/:requestId' element={<MyBookingPage />} />
      <Route path='/request-documents' element={<RequestDocumentsPage />} />
      <Route path='/my-documents/:requestId' element={<MyDocumentsPage />} />

      {/* non-public routes */}
      <Route element={<ProtectedRoute />}>
        <Route path='/dashboard' element={<Dashboard />} />
        <Route path='/schedule' element={<Schedule />} />
        <Route path='/appointments' element={<AllAppointments />} />
        <Route path='/patients' element={<Patients />} />
        <Route path='/patients/:patientId' element={<PatientDetail />} />
        <Route element={<AdminRoute />}>
          <Route path='/admin/users' element={<Users />} />
        </Route>
        <Route element={<RoleRoute roles={['STAFF', 'ADMIN', 'PROVIDER']} />}>
          <Route path='/booking-requests' element={<BookingRequests />} />
        </Route>
        <Route element={<RoleRoute roles={['STAFF', 'ADMIN']} />}>
          <Route path='/document-requests' element={<DocumentRequests />} />
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
