import { useRef, useState, type FormEvent } from 'react'
import { Note, NoteAttachment } from '../types/Notes'
import { addNote } from '../api/fetchApi'

type NoteProp = {
  appointmentId: number
  notes: Note[]
}

function readFileAsAttachment(file: File): Promise<NoteAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve({
      id: Date.now() + Math.random(),
      name: file.name,
      type: file.type,
      size: file.size,
      dataUrl: reader.result as string,
    })
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

const MAX_ATTACHMENT_SIZE = 1.5 * 1024 * 1024

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const Notes = ({ appointmentId, notes: initialNotes }: NoteProp) => {
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [text, setText] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!text.trim() && files.length === 0) return

    const oversizedFile = files.find(file => file.size > MAX_ATTACHMENT_SIZE)
    if (oversizedFile) {
      setError(`"${oversizedFile.name}" is too large (max ${formatFileSize(MAX_ATTACHMENT_SIZE)} per file).`)
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const attachments = await Promise.all(files.map(readFileAsAttachment))
      const savedNote = await addNote(appointmentId, {
        text: text.trim(),
        author: 'Front Desk',
        attachments,
      })
      setNotes(prev => [...prev, savedNote])
      setText('')
      setFiles([])
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save note. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {notes?.length === 0
        ? <div className='text-sm text-gray-500'>No notes yet</div>
        : (
          <ul className='space-y-3'>
            {notes?.map(note => (
              <li key={note.id} className='text-sm'>
                <div className='flex items-baseline gap-2'>
                  <span className='font-medium text-gray-800'>{note.author}</span>
                  <span className='text-xs text-gray-400'>{new Date(note.createdAt).toLocaleString()}</span>
                </div>
                {note.text && <p className='text-gray-700'>{note.text}</p>}
                {note.attachments.length > 0 && (
                  <ul className='mt-1 flex flex-wrap gap-2'>
                    {note.attachments.map(attachment => (
                      <li key={attachment.id}>
                        <a
                          href={attachment.dataUrl}
                          download={attachment.name}
                          className='inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-blue-700 hover:bg-gray-100'
                        >
                          📎 {attachment.name}
                          <span className='text-gray-400'>({formatFileSize(attachment.size)})</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )
      }

      <form onSubmit={handleSubmit} className='mt-3 flex flex-col gap-2'>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='Add a note...'
          rows={2}
          className='w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
        />
        <div className='flex items-center gap-2'>
          <input
            ref={fileInputRef}
            type='file'
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            className='flex-1 text-xs text-gray-600'
          />
          <button
            type='submit'
            disabled={submitting || (!text.trim() && files.length === 0)}
            className='rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50'
          >
            {submitting ? 'Saving...' : 'Add Note'}
          </button>
        </div>
        <div className='text-xs text-gray-400'>Max {formatFileSize(MAX_ATTACHMENT_SIZE)} per file</div>
        {files.length > 0 && (
          <div className='text-xs text-gray-500'>{files.length} file(s) selected</div>
        )}
        {error && <div className='text-xs text-red-600'>{error}</div>}
      </form>
    </div>
  )
}

export default Notes
