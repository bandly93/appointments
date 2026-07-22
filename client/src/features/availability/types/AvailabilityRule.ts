export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY'

export type AvailabilityRule = {
  id: string
  providerId: string
  dayOfWeek: DayOfWeek
  startMinute: number
  endMinute: number
  slotDurationMinutes: number
  timezone: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type AvailabilityRuleInput = {
  dayOfWeek: DayOfWeek
  startMinute: number
  endMinute: number
  slotDurationMinutes: number
  timezone: string
}
