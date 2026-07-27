import { type DocumentRequestStatus } from '../types/DocumentRequest'

export const STATUS_LABELS: Record<DocumentRequestStatus, string> = {
  UNVERIFIED: 'Awaiting email confirmation',
  PENDING: 'Needs fulfillment',
  FULFILLED: 'Fulfilled',
  DECLINED: 'Declined',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
}

const STATUS_STYLES: Record<DocumentRequestStatus, string> = {
  UNVERIFIED: 'bg-gray-100 text-gray-600',
  PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
  FULFILLED: 'bg-green-50 text-green-700 border border-green-200',
  DECLINED: 'bg-red-50 text-red-700 border border-red-200',
  CANCELLED: 'bg-gray-100 text-gray-600',
  EXPIRED: 'bg-gray-100 text-gray-500',
}

export default function StatusBadge({ status }: { status: DocumentRequestStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}
