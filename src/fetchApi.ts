import { type Appointment, type GetAppointmentsParams } from './types/Appointments'
import { type Note, type NoteAttachment } from './types/Notes'

const numOfAppointments = 5000

const firstNames = [
  'Olivia', 'Liam', 'Emma', 'Noah', 'Ava', 'Elijah', 'Sophia', 'James',
  'Isabella', 'Benjamin', 'Mia', 'Lucas', 'Amelia', 'Henry', 'Harper',
  'Alexander', 'Evelyn', 'Sebastian', 'Abigail', 'Jack', 'Emily', 'Owen',
  'Elizabeth', 'Daniel', 'Sofia', 'Matthew', 'Avery', 'Aiden', 'Ella', 'Joseph'
]

const lastNames = [
  'Nguyen', 'Smith', 'Garcia', 'Patel', 'Kim', 'Johnson', 'Martinez', 'Lee',
  'Brown', 'Rodriguez', 'Chen', 'Williams', 'Davis', 'Wilson', 'Anderson',
  'Thompson', 'Moore', 'Taylor', 'Jackson', 'White', 'Harris', 'Clark',
  'Lewis', 'Walker', 'Young', 'Hall', 'Allen', 'King', 'Wright', 'Torres'
]

const providers = [
  'Kaiser', 'Sutter', 'Stanford Health', 'UCSF Medical', 'Dignity Health',
  'John Muir Health', 'Cedars-Sinai', 'Mayo Clinic'
]

const statuses: Appointment['status'][] = ['Scheduled', 'Checked In', 'Completed']

const STORAGE_KEY = 'appointments-db'

function generateAppointments(): Appointment[] {
  const appointments: Appointment[] = []

  for (let i = 0; i < numOfAppointments; i++) {
    const firstName = firstNames[i % firstNames.length]
    const lastName = lastNames[(i + Math.floor(i / firstNames.length)) % lastNames.length]
    const appointmentDate = new Date()
    appointmentDate.setDate(appointmentDate.getDate() + (i % 14))
    appointmentDate.setHours(8 + (i % 9), (i % 4) * 15, 0, 0)

    appointments.push({
      id: i,
      patientName: `${firstName} ${lastName}`,
      provider: providers[i % providers.length],
      time: appointmentDate.toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }),
      status: statuses[i % statuses.length],
      notes: []
    })
  }

  return appointments
}

function normalizeAppointment(appointment: Appointment): Appointment {
  return {
    ...appointment,
    notes: (appointment.notes ?? []).map(note => ({
      ...note,
      attachments: note.attachments ?? [],
    })),
  }
}

function loadAppointments(): Appointment[] {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    const appointments = JSON.parse(stored) as Appointment[]
    return appointments.map(normalizeAppointment)
  }

  const appointments = generateAppointments()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments))
  return appointments
}

export function updateAppointmentStatus(appointmentId: number, status: Appointment['status']) {
  const appointments = loadAppointments()
  const appointment = appointments.find(({ id }) => id === appointmentId)

  if (!appointment) {
    return Promise.reject(new Error(`Appointment ${appointmentId} not found`))
  }

  appointment.status = status
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments))

  return Promise.resolve(appointment)
}

export function addNote(
  appointmentId: number,
  note: { text: string, author: string, attachments: NoteAttachment[] }
) {
  const appointments = loadAppointments()
  const appointment = appointments.find(({ id }) => id === appointmentId)

  if (!appointment) {
    return Promise.reject(new Error(`Appointment ${appointmentId} not found`))
  }

  const savedNote: Note = {
    id: Date.now(),
    text: note.text,
    author: note.author,
    attachments: note.attachments,
    createdAt: new Date().toISOString(),
  }

  appointment.notes = [...appointment.notes, savedNote]

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments))
  } catch (err) {
    return Promise.reject(new Error('Storage limit reached. Try a smaller file or fewer attachments.'))
  }

  return Promise.resolve(savedNote)
}

export function getAppointments({ search, status: statusFilter }: GetAppointmentsParams) {
  const appointments = loadAppointments()

  let filtered = appointments

  if (search !== '') {
    filtered = filtered.filter(({ patientName, provider }) => {
      let byPatient = patientName.toLowerCase().includes(search.toLowerCase())
      let byProvider = provider.toLowerCase().includes(search.toLowerCase())
      return (byPatient || byProvider)
    })
  }

  if (statusFilter !== 'All') {
    filtered = filtered.filter(({ status }) => status === statusFilter)
  }

  return new Promise<{ appointments: Appointment[], count: number }>((resolve) => {
    setTimeout(() => {
      resolve({
        appointments: filtered,
        count: filtered.length
      })
    }, 500)
  })
}
