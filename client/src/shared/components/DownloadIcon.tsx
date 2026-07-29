export default function DownloadIcon({ className = 'h-4 w-4 shrink-0' }: { className?: string }) {
  return (
    <svg viewBox='0 0 20 20' fill='none' className={className}>
      <path
        d='M10 3v9m0 0-3.5-3.5M10 12l3.5-3.5M4 14.5v.5a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-.5'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}
