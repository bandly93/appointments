import { useState } from 'react'

export const useDateSelector = () => {

  const [startDate, setStartDate] = useState<string| null>(null)
  const [endDate, setEndDate] = useState<string | null>(null)


  return {
    startDate,
    setStartDate,
    endDate,
    setEndDate
  }
}
