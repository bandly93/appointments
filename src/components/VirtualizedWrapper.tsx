import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { Appointment } from '../types/Appointments'
import TableRow from './TableRow'

type Props = {
  appointments: Appointment[]
  onOpenNotes: (appointmentId: number) => void
}

const ESTIMATED_ROW_HEIGHT = 52
const VIEWPORT_HEIGHT = 600
const OVERSCAN = 5

export default function VirtualizedAppointments({ appointments, onOpenNotes }: Props) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: appointments.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: OVERSCAN,
  })

  return (
    <div ref={parentRef} style={{ height: VIEWPORT_HEIGHT, overflowY: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={appointments[virtualRow.index].id}
            data-index={virtualRow.index}
            ref={virtualizer.measureElement}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <TableRow appointment={appointments[virtualRow.index]} onOpenNotes={onOpenNotes} />
          </div>
        ))}
      </div>
    </div>
  )
}
