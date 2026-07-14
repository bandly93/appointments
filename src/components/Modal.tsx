import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

type Props = {
  title?: string
  onClose: () => void
  children: ReactNode
}

export default function Modal({ title, onClose, children }: Props) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return createPortal(
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'
      onClick={onClose}
    >
      <div
        className='w-full max-w-lg rounded-lg border border-gray-200 bg-white shadow-lg'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex items-center justify-between border-b border-gray-200 px-4 py-3'>
          <h2 className='text-sm font-semibold text-gray-900'>{title}</h2>
          <button
            type='button'
            onClick={onClose}
            aria-label='Close'
            className='text-gray-400 hover:text-gray-600'
          >
            ✕
          </button>
        </div>
        <div className='max-h-[70vh] overflow-y-auto px-4 py-4'>
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
