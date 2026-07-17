interface PropTypes {
  startDate: string | null
  endDate: string | null
  setStartDate: (date: string | null) => void
  setEndDate: (date: string | null) => void
}

const DateSelector = ({ startDate, endDate, setStartDate, setEndDate }: PropTypes) => {
  return (
    <div className='flex items-center gap-3'>
      <div className='flex items-center gap-2'>
        <label htmlFor='start-date' className='text-sm font-medium text-gray-700 whitespace-nowrap'>
          Start Date
        </label>
        <input
          id='start-date'
          type='date'
          value={startDate ?? ''}
          max={endDate ?? undefined}
          onChange={(e) => setStartDate(e.target.value || null)}
          className='rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
        />
      </div>
      <div className='flex items-center gap-2'>
        <label htmlFor='end-date' className='text-sm font-medium text-gray-700 whitespace-nowrap'>
          End Date
        </label>
        <input
          id='end-date'
          type='date'
          value={endDate ?? ''}
          min={startDate ?? undefined}
          onChange={(e) => setEndDate(e.target.value || null)}
          className='rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
        />
      </div>
    </div>
  )
}

export default DateSelector
