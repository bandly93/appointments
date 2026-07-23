function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function DateNav({ date, onChange }: { date: string; onChange: (date: string) => void }) {
  return (
    <div className='flex items-center gap-2 mb-4'>
      <button
        type='button'
        onClick={() => onChange(shiftDate(date, -1))}
        aria-label='Previous day'
        className='rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50'
      >
        ←
      </button>
      <input
        type='date'
        value={date}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className='rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
      />
      <button
        type='button'
        onClick={() => onChange(shiftDate(date, 1))}
        aria-label='Next day'
        className='rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50'
      >
        →
      </button>
      {date !== todayDateString() && (
        <button
          type='button'
          onClick={() => onChange(todayDateString())}
          className='rounded-md border border-gray-300 px-3 py-2 text-sm text-blue-700 hover:bg-blue-50'
        >
          Today
        </button>
      )}
    </div>
  )
}
