import { useState } from 'react'
import { useDebounce } from './useDebounce'

export type StatusFilter = 'Scheduled' | 'Checked In' | 'Completed' | 'All'

export const useAppointmentFilters = () => {
  const [search, setSearch] = useState<string>('')
  const [status, setStatus] = useState<StatusFilter>('All')
  const [startDate, setStartDate] = useState<string | null>(null)
  const [endDate, setEndDate] = useState<string | null>(null)
  const debouncedSearch = useDebounce(search)

  return {
    search,
    setSearch,
    debouncedSearch,
    status,
    setStatus,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
  }
}
