import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { getPatientDocuments, uploadPatientDocument, downloadPatientDocument } from '../api/patientDocumentsApi'
import { type PatientDocument, PATIENT_DOCUMENT_TYPES } from '../types/PatientDocument'
import { formatFileSize } from '../../../shared/lib/formatFileSize'
import DownloadIcon from '../../../shared/components/DownloadIcon'

function uploaderLabel(doc: PatientDocument): string {
  if (doc.uploadedByRole === 'PATIENT') return 'Patient'
  const who = doc.uploadedByUser?.displayName ?? doc.uploadedByUser?.email ?? 'Staff'
  return `${who} (${doc.uploadedByRole === 'PROVIDER' ? 'Provider' : 'Staff'})`
}

export default function PatientDocumentsPanel({ patientId }: { patientId: string }) {
  const { authFetch } = useAuth()
  const [documents, setDocuments] = useState<PatientDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [documentType, setDocumentType] = useState<string>(PATIENT_DOCUMENT_TYPES[0])
  const [visibleToPatient, setVisibleToPatient] = useState(true)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const load = () => {
    setError(null)
    getPatientDocuments(authFetch, patientId)
      .then(setDocuments)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load documents'))
      .finally(() => setLoading(false))
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [patientId])

  async function handleFileChosen(file: File) {
    setIsUploading(true)
    setError(null)
    try {
      const document = await uploadPatientDocument(authFetch, patientId, file, documentType, visibleToPatient)
      setDocuments((current) => [document, ...current])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDownload(doc: PatientDocument) {
    setError(null)
    try {
      await downloadPatientDocument(authFetch, doc.id, doc.fileOriginalName)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download file')
    }
  }

  return (
    <div>
      <h2 className='text-lg font-semibold text-gray-900 mt-6 mb-2'>Documents ({documents.length})</h2>

      <div className='rounded-lg border border-gray-200 bg-white shadow-sm p-4 mb-3'>
        <div className='flex flex-wrap items-end gap-3'>
          <div>
            <label htmlFor='doc-upload-type' className='mb-1 block text-xs font-medium text-gray-700'>Type</label>
            <select
              id='doc-upload-type'
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className='rounded-md border border-gray-300 px-2.5 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            >
              {PATIENT_DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <label className='flex items-center gap-1.5 pb-1.5 text-sm text-gray-700'>
            <input
              type='checkbox'
              checked={visibleToPatient}
              onChange={(e) => setVisibleToPatient(e.target.checked)}
              className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
            />
            Visible to patient
          </label>
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
            className='rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-500 disabled:opacity-50'
          >
            {isUploading ? 'Uploading…' : 'Upload file'}
          </button>
        </div>
      </div>

      {error && (
        <div className='mb-3 rounded-md bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm'>
          {error}
        </div>
      )}

      <div className='overflow-x-auto rounded-lg border border-gray-200 shadow-sm'>
        <div className='grid grid-cols-[1fr_1fr_1fr_110px] bg-gray-50'>
          <div className='px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500'>File</div>
          <div className='px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500'>Uploaded by</div>
          <div className='px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500'>Date</div>
          <div className='px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500'>Visibility</div>
        </div>
        <div className='divide-y divide-gray-200'>
          {loading
            ? <div className='px-4 py-10 text-center text-gray-500'>Loading....</div>
            : documents.length !== 0
              ? documents.map((doc) => (
                <div key={doc.id} className='grid grid-cols-[1fr_1fr_1fr_110px] items-center hover:bg-gray-50/70 transition-colors'>
                  <div className='px-4 py-3.5 text-sm'>
                    <div className='text-gray-900'>{doc.documentType}</div>
                    <button
                      type='button'
                      onClick={() => void handleDownload(doc)}
                      className='inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800'
                    >
                      <DownloadIcon className='h-3.5 w-3.5 shrink-0' />
                      <span className='truncate max-w-[160px]'>{doc.fileOriginalName}</span>
                      <span className='text-gray-400 font-normal'>({formatFileSize(doc.fileSizeBytes)})</span>
                    </button>
                  </div>
                  <div className='px-4 py-3.5 text-sm text-gray-700'>{uploaderLabel(doc)}</div>
                  <div className='px-4 py-3.5 text-sm text-gray-700'>
                    {new Date(doc.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className='px-4 py-3.5 text-sm'>
                    {doc.visibleToPatient
                      ? <span className='text-xs text-gray-500'>Visible</span>
                      : <span className='inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600'>Internal only</span>
                    }
                  </div>
                </div>
              ))
              : <div className='px-4 py-10 text-center text-gray-500'>No documents yet</div>
          }
        </div>
      </div>
    </div>
  )
}
