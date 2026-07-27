import { useEffect, useState } from "react"
import AppointmentsTable from "../components/Table"
import DateNav, { todayDateString } from "../components/DateNav"
import Navbar from "../../layout/Navbar"
import PendingRequestsPanel from "../../bookingRequests/components/PendingRequestsPanel"
import { bookingRequestEvents, BOOKING_REQUESTS_CHANGED } from "../../bookingRequests/events"

export default function Dashboard() {
  const [date, setDate] = useState(todayDateString())
  const [refreshToken, setRefreshToken] = useState(0)

  // Approving a request creates an appointment that may belong on the visible
  // date, so refetch the table whenever a request is decided.
  useEffect(
    () => bookingRequestEvents.subscribe(BOOKING_REQUESTS_CHANGED, () => setRefreshToken((n) => n + 1)),
    []
  )

  return (
    <div className='flex flex-col'>
      <Navbar />
      <div className='p-6'>
        <div className='w-full max-w-5xl mx-auto'>
          <PendingRequestsPanel />
          <DateNav date={date} onChange={setDate} />
          <AppointmentsTable date={date} refreshToken={refreshToken} />
        </div>
      </div>
    </div>
  )
}
