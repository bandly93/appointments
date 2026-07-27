import { type BookingStatus } from '../types/BookingRequest'

export const STATUS_LABELS: Record<BookingStatus, string> = {
  UNVERIFIED: 'Awaiting email confirmation',
  PENDING: 'Needs approval',
  APPROVED: 'Approved',
  REJECTED: 'Declined',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
}

const STATUS_STYLES: Record<BookingStatus, string> = {
  UNVERIFIED: 'bg-gray-100 text-gray-600',
  PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
  APPROVED: 'bg-green-50 text-green-700 border border-green-200',
  REJECTED: 'bg-red-50 text-red-700 border border-red-200',
  CANCELLED: 'bg-gray-100 text-gray-600',
  EXPIRED: 'bg-gray-100 text-gray-500',
}

export default function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}
