import AppointmentsTable from "../components/Table"
import ActivityFeed from "../components/ActivityFeed"
import StatusToast from "../components/StatusToast"
import Navbar from "../../layout/Navbar"

export default function Dashboard() {
  return (
    <div className='flex flex-col'>
      <Navbar />
      <div className='flex flex-col lg:flex-row gap-6 p-6'>
        <ActivityFeed />
        <AppointmentsTable />
        <StatusToast />
      </div>
    </div>
  )
}
