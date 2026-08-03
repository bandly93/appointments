import { useEffect, useState } from 'react'
import { getOfficeContact } from '../api/publicBookingApi'

// Always shown, independent of whether any particular email is known to
// have failed — the office's contact info is a durable offline path for
// whichever notification a patient never received.
export default function ContactFallback() {
  const [contact, setContact] = useState<{
    officePhone: string | null
    officeEmail: string | null
    officeLocation: string | null
  } | null>(null)

  useEffect(() => {
    getOfficeContact().then(setContact).catch(() => setContact(null))
  }, [])

  if (!contact || (!contact.officePhone && !contact.officeEmail && !contact.officeLocation)) return null

  const parts: string[] = []
  if (contact.officePhone) parts.push(`call us at ${contact.officePhone}`)
  if (contact.officeEmail) parts.push(`email ${contact.officeEmail}`)

  return (
    <p className='text-xs text-gray-500 text-center'>
      {parts.length > 0 && <>Can't find an email? {parts.join(' or ')}. </>}
      {contact.officeLocation && <>We're located at {contact.officeLocation}.</>}
    </p>
  )
}
