const MIN_DURATION_MINUTES = 15
const MAX_DURATION_MINUTES = 480

export { MIN_DURATION_MINUTES, MAX_DURATION_MINUTES }

// Rounds a record's actual [startsAt, endsAt) span to the nearest step this
// stepper can represent, so re-opening an editor on an existing
// booking/appointment starts from a value the +/-15/30 buttons can land back
// on exactly.
export function nominalDurationMinutes(record: { startsAt: string; endsAt: string }): number {
  const minutes = (new Date(record.endsAt).getTime() - new Date(record.startsAt).getTime()) / 60_000
  return Math.min(MAX_DURATION_MINUTES, Math.max(MIN_DURATION_MINUTES, Math.round(minutes / 15) * 15))
}

export default function DurationStepper({
  minutes,
  onChange,
}: {
  minutes: number
  onChange: (minutes: number) => void
}) {
  function adjust(delta: number) {
    onChange(Math.min(MAX_DURATION_MINUTES, Math.max(MIN_DURATION_MINUTES, minutes + delta)))
  }

  return (
    <div className='flex items-center gap-2'>
      <button
        type='button'
        onClick={() => adjust(-30)}
        disabled={minutes <= MIN_DURATION_MINUTES}
        className='rounded-md border border-gray-300 px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:border-blue-500 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40'
      >
        −30
      </button>
      <button
        type='button'
        onClick={() => adjust(-15)}
        disabled={minutes <= MIN_DURATION_MINUTES}
        className='rounded-md border border-gray-300 px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:border-blue-500 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40'
      >
        −15
      </button>
      <span className='w-20 text-center text-sm font-medium text-gray-900'>{minutes} min</span>
      <button
        type='button'
        onClick={() => adjust(15)}
        disabled={minutes >= MAX_DURATION_MINUTES}
        className='rounded-md border border-gray-300 px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:border-blue-500 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40'
      >
        +15
      </button>
      <button
        type='button'
        onClick={() => adjust(30)}
        disabled={minutes >= MAX_DURATION_MINUTES}
        className='rounded-md border border-gray-300 px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:border-blue-500 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40'
      >
        +30
      </button>
    </div>
  )
}
