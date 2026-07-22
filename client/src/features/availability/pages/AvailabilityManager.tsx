import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { getMyRules, createRule, deleteRule } from '../api/availabilityApi'
import { type AvailabilityRule, type DayOfWeek } from '../types/AvailabilityRule'
import Modal from '../../../shared/components/Modal'
import Navbar from '../../layout/Navbar'

const DAYS: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

function formatMinutes(minutes: number): string {
  const hh = Math.floor(minutes / 60).toString().padStart(2, '0')
  const mm = (minutes % 60).toString().padStart(2, '0')
  return `${hh}:${mm}`
}

function timeToMinutes(time: string): number {
  const [hh, mm] = time.split(':').map(Number)
  return hh * 60 + mm
}

export default function AvailabilityManager() {
  const { authFetch } = useAuth()
  const [rules, setRules] = useState<AvailabilityRule[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const loadRules = async () => {
    setLoading(true)
    setError(null)
    try {
      setRules(await getMyRules(authFetch))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load availability')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRules()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleDelete(id: string) {
    try {
      await deleteRule(authFetch, id)
      setRules((current) => current.filter((rule) => rule.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete rule')
    }
  }

  return (
    <div className='flex flex-col'>
      <Navbar />
      <div className='w-full max-w-3xl mx-auto p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h1 className='text-2xl font-semibold text-gray-900'>My availability ({rules.length})</h1>
          <button
            type='button'
            onClick={() => setIsModalOpen(true)}
            className='rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500'
          >
            Add rule
          </button>
        </div>

        {error && (
          <div className='mb-4 rounded-md bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm'>
            {error}
          </div>
        )}

        {loading
          ? <div className='py-10 text-center text-gray-500'>Loading....</div>
          : (
            <div className='overflow-x-auto rounded-lg border border-gray-200 shadow-sm'>
              <div className='grid grid-cols-[140px_1fr_1fr_140px_1fr_80px] bg-gray-50'>
                <div className='px-4 py-3 text-sm font-semibold text-gray-700'>Day</div>
                <div className='px-4 py-3 text-sm font-semibold text-gray-700'>Start</div>
                <div className='px-4 py-3 text-sm font-semibold text-gray-700'>End</div>
                <div className='px-4 py-3 text-sm font-semibold text-gray-700'>Slot length</div>
                <div className='px-4 py-3 text-sm font-semibold text-gray-700'>Timezone</div>
                <div className='px-4 py-3 text-sm font-semibold text-gray-700'></div>
              </div>
              {rules.length !== 0
                ? rules.map((rule) => (
                  <div key={rule.id} className='grid grid-cols-[140px_1fr_1fr_140px_1fr_80px] border-t border-gray-200'>
                    <div className='px-4 py-3 text-sm text-gray-900'>{rule.dayOfWeek}</div>
                    <div className='px-4 py-3 text-sm text-gray-700'>{formatMinutes(rule.startMinute)}</div>
                    <div className='px-4 py-3 text-sm text-gray-700'>{formatMinutes(rule.endMinute)}</div>
                    <div className='px-4 py-3 text-sm text-gray-700'>{rule.slotDurationMinutes} min</div>
                    <div className='px-4 py-3 text-sm text-gray-500'>{rule.timezone}</div>
                    <div className='px-4 py-3 text-sm'>
                      <button
                        type='button'
                        onClick={() => handleDelete(rule.id)}
                        className='text-red-600 hover:text-red-800'
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
                : (
                  <div className='px-4 py-10 text-center text-gray-500'>
                    No availability rules yet
                  </div>
                )
              }
            </div>
          )
        }

        {isModalOpen && (
          <CreateRuleModal
            onClose={() => setIsModalOpen(false)}
            onCreated={(rule) => {
              setRules((current) => [...current, rule])
              setIsModalOpen(false)
            }}
          />
        )}
      </div>
    </div>
  )
}

function CreateRuleModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (rule: AvailabilityRule) => void
}) {
  const { authFetch } = useAuth()
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('MONDAY')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(30)
  const [timezone, setTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const rule = await createRule(authFetch, {
        dayOfWeek,
        startMinute: timeToMinutes(startTime),
        endMinute: timeToMinutes(endTime),
        slotDurationMinutes,
        timezone,
      })
      onCreated(rule)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create rule')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal title='Add availability rule' onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className='mb-4'>
          <label htmlFor='rule-day' className='mb-1.5 block text-sm font-medium text-gray-700'>
            Day of week
          </label>
          <select
            id='rule-day'
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)}
            className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          >
            {DAYS.map((day) => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
        </div>

        <div className='mb-4 grid grid-cols-2 gap-3'>
          <div>
            <label htmlFor='rule-start' className='mb-1.5 block text-sm font-medium text-gray-700'>
              Start
            </label>
            <input
              id='rule-start'
              type='time'
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            />
          </div>
          <div>
            <label htmlFor='rule-end' className='mb-1.5 block text-sm font-medium text-gray-700'>
              End
            </label>
            <input
              id='rule-end'
              type='time'
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            />
          </div>
        </div>

        <div className='mb-4'>
          <label htmlFor='rule-duration' className='mb-1.5 block text-sm font-medium text-gray-700'>
            Slot duration (minutes)
          </label>
          <input
            id='rule-duration'
            type='number'
            required
            min={5}
            max={480}
            step={5}
            value={slotDurationMinutes}
            onChange={(e) => setSlotDurationMinutes(Number(e.target.value))}
            className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          />
        </div>

        <div className='mb-4'>
          <label htmlFor='rule-timezone' className='mb-1.5 block text-sm font-medium text-gray-700'>
            Timezone (IANA)
          </label>
          <input
            id='rule-timezone'
            type='text'
            required
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          />
        </div>

        {error && (
          <div className='mb-4 rounded-md bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm'>
            {error}
          </div>
        )}

        <div className='flex justify-end gap-2'>
          <button
            type='button'
            onClick={onClose}
            className='rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50'
          >
            Cancel
          </button>
          <button
            type='submit'
            disabled={isSubmitting}
            className='rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {isSubmitting ? 'Adding…' : 'Add rule'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
