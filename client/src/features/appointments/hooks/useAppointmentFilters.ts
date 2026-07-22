import { useState } from 'react'
import { useDebounce } from '../../../shared/hooks/useDebounce'

export type StatusFilter = 'Scheduled' | 'Checked In' | 'Completed' | 'All'

export const useAppointmentFilters = () => {
  const [search, setSearch] = useState<string>('')
  const [status, setStatus] = useState<StatusFilter>('All')
  const [startDate, setStartDate] = useState<string | null>(null)
  const [endDate, setEndDate] = useState<string | null>(null)
  const debouncedSearch = useDebounce(search)

  const clearFilters = () => {
    setSearch('')
    setStatus('All')
    setStartDate(null)
    setEndDate(null)
  }

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
    clearFilters,
  }
}
