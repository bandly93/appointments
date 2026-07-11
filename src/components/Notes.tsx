import { useState, useEffect } from 'react'
import { Note } from '../types/Notes'

type NoteProp = {
  notes: Note[]
}

const Notes = ({ notes }: NoteProp) => {
  const [notesData, setNote] = useState<Note[] | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    const callApi = async () => {
      try {
        setLoading(true)
        // const note = await fetchNote(appointmentId)
        
        setTimeout(() => {
          setNote(notes)
        }, 5000)
      } catch (error) {
        setError(error)
      } finally {
        setLoading(false)
      }
    }
    callApi()
  }, [notes])

  return (
    <div>
      <h1> Notes </h1>
      <hr></hr>
      {loading && <div> Loading notes... </div>}
      {error && <div>{JSON.stringify(error)}</div>}
      {notesData ? (
        <div>
          {notesData.map(note => <div> {note.text} </div>)}
        </div>
      ) : (
        <div> No notes...</div>
      )
      }
    </div>
  )
}

export default Notes