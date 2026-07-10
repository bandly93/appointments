export type Appointment = {
  id: number;
  patientName: string;
  provider: string;
  time: string;
  status: "Scheduled" | "Checked In" | "Completed";
};

export interface GetAppointmentsParams {
  search: string,
  status: "Scheduled" | "Checked In" | "Completed" | "All"
}
