import { createEventEmitter } from '../../shared/events/createEventEmitter'

// Published whenever a booking request is approved/rejected/deleted so other
// mounted views (navbar badge, dashboard panel, appointments table) can refresh.
export const bookingRequestEvents = createEventEmitter()
export const BOOKING_REQUESTS_CHANGED = 'bookingRequestsChanged'
