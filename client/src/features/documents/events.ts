import { createEventEmitter } from '../../shared/events/createEventEmitter'

// Published whenever a document request is fulfilled/declined so other
// mounted views (navbar badge, patient detail) can refresh.
export const documentRequestEvents = createEventEmitter()
export const DOCUMENT_REQUESTS_CHANGED = 'documentRequestsChanged'
