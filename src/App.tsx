import AppointmentsTable from "./components/Table"
import ActivityFeed from "./components/ActivityFeed"

function App() {
  return (
    <div className='flex flex-col lg:flex-row gap-6 p-6'>
      <ActivityFeed />
      <AppointmentsTable />
    </div>
  )
}

export default App
