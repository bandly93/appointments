import { useState, useEffect } from 'react'

export const useDebounce = (value: string, delay = 500) => {
  const [debouncedValue, setDebounceValue] = useState(value)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebounceValue(value)
    }, delay)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [value, delay])
  
  return debouncedValue
}
