import { Note } from '../types/Notes'

export type Appointment = {
  id: number;
  patientName: string;
  provider: string;
  time: string;
  status: "Scheduled" | "Checked In" | "Completed";
  notes: Note [];
};

export interface GetAppointmentsParams {
  search: string,
  status: "Scheduled" | "Checked In" | "Completed" | "All",
  startDate: string | null,
  endDate: string | null
}
