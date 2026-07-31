import { useEffect, useState } from 'react'
import { getMyDocuments, getMyDocumentFileUrl } from '../api/publicPatientDocumentsApi'
import { type PatientDocument } from '../types/PatientDocument'
import { formatFileSize } from '../../../shared/lib/formatFileSize'
import DownloadIcon from '../../../shared/components/DownloadIcon'

export default function MyDocumentsPanel({ bookingRequestId, token }: { bookingRequestId: string; token: string }) {
  const [documents, setDocuments] = useState<PatientDocument[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyDocuments(bookingRequestId, token)
      .then(setDocuments)
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false))
  }, [bookingRequestId, token])

  // Nothing to show and nothing the patient can do here — staff/providers
  // are the only ones who add documents, so an empty panel is just noise.
  if (loading || documents.length === 0) return null

  return (
    <div className='rounded-lg border border-gray-200 bg-white shadow-sm p-4 mb-4'>
      <h2 className='text-sm font-semibold text-gray-900 mb-3'>Documents</h2>
      <ul className='flex flex-col gap-1.5'>
        {documents.map((doc) => (
          <li key={doc.id}>
            <a
              href={getMyDocumentFileUrl(bookingRequestId, doc.id, token)}
              className='inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800'
            >
              <DownloadIcon />
              {doc.documentType} — {doc.fileOriginalName}
              <span className='text-gray-400 font-normal'>({formatFileSize(doc.fileSizeBytes)})</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
