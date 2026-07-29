import { useEffect, useRef, useState } from 'react'
import { getMyDocuments, uploadMyDocument, getMyDocumentFileUrl } from '../api/publicPatientDocumentsApi'
import { type PatientDocument, PATIENT_DOCUMENT_TYPES } from '../types/PatientDocument'
import { formatFileSize } from '../../../shared/lib/formatFileSize'
import DownloadIcon from '../../../shared/components/DownloadIcon'

export default function MyDocumentsPanel({ bookingRequestId, token }: { bookingRequestId: string; token: string }) {
  const [documents, setDocuments] = useState<PatientDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [documentType, setDocumentType] = useState<string>(PATIENT_DOCUMENT_TYPES[0])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    getMyDocuments(bookingRequestId, token)
      .then(setDocuments)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load documents'))
      .finally(() => setLoading(false))
  }, [bookingRequestId, token])

  async function handleFileChosen(file: File) {
    setIsUploading(true)
    setError(null)
    try {
      const document = await uploadMyDocument(bookingRequestId, token, file, documentType)
      setDocuments((current) => [document, ...current])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  if (loading) return null

  return (
    <div className='rounded-lg border border-gray-200 bg-white shadow-sm p-4 mb-4'>
      <h2 className='text-sm font-semibold text-gray-900 mb-1'>Documents</h2>
      <p className='text-xs text-gray-500 mb-3'>
        Upload a photo of your ID, insurance card, or other paperwork ahead of your appointment.
      </p>

      {error && (
        <div className='mb-3 rounded-md bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm'>
          {error}
        </div>
      )}

      {documents.length !== 0 && (
        <ul className='mb-3 flex flex-col gap-1.5'>
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
      )}

      <div className='flex flex-wrap items-center gap-2'>
        <select
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          className='rounded-md border border-gray-300 px-2.5 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
        >
          {PATIENT_DOCUMENT_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <input
          ref={fileInputRef}
          type='file'
          accept='.pdf,.png,.jpg,.jpeg,.doc,.docx'
          className='hidden'
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleFileChosen(file)
          }}
        />
        <button
          type='button'
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className='rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50'
        >
          {isUploading ? 'Uploading…' : 'Upload file'}
        </button>
      </div>
    </div>
  )
}
