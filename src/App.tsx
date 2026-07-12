import AppointmentsTable from "./components/Table"
import ActivityFeed from "./components/ActivityFeed"
import StatusToast from "./components/StatusToast"

function App() {
  return (
    <div className='flex flex-col lg:flex-row gap-6 p-6'>
      <ActivityFeed />
      <AppointmentsTable />
      <StatusToast />
    </div>
  )
}

export default App
