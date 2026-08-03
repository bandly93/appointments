import { useEffect, useState } from 'react'
import { getClinicContact } from '../api/publicBookingApi'

// Always shown, independent of whether any particular email is known to
// have failed — the office's contact info is a durable offline path for
// whichever notification a patient never received.
export default function ContactFallback() {
  const [contact, setContact] = useState<{ clinicPhone: string | null; clinicEmail: string | null } | null>(null)

  useEffect(() => {
    getClinicContact().then(setContact).catch(() => setContact(null))
  }, [])

  if (!contact || (!contact.clinicPhone && !contact.clinicEmail)) return null

  const parts: string[] = []
  if (contact.clinicPhone) parts.push(`call us at ${contact.clinicPhone}`)
  if (contact.clinicEmail) parts.push(`email ${contact.clinicEmail}`)

  return (
    <p className='text-xs text-gray-500 text-center'>
      Can't find an email? {parts.join(' or ')}.
    </p>
  )
}
