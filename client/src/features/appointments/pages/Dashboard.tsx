import { useState } from "react"
import AppointmentsTable from "../components/Table"
import DateNav, { todayDateString } from "../components/DateNav"
import Navbar from "../../layout/Navbar"

export default function Dashboard() {
  const [date, setDate] = useState(todayDateString())

  return (
    <div className='flex flex-col'>
      <Navbar />
      <div className='p-6'>
        <div className='w-full max-w-5xl mx-auto'>
          <DateNav date={date} onChange={setDate} />
          <AppointmentsTable date={date} />
        </div>
      </div>
    </div>
  )
}
