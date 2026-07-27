import { addDays, toLocalDateString } from '../lib/week'

export type CalendarBlock = {
  id: string
  startsAt: string
  endsAt: string
  title: string
  subtitle?: string
  tone: 'blue' | 'green' | 'gray' | 'amber'
  dashed?: boolean
  strike?: boolean
}

const HOUR_PX = 56
const DEFAULT_START_HOUR = 8
const DEFAULT_END_HOUR = 18

const TONE_STYLES: Record<CalendarBlock['tone'], string> = {
  blue: 'bg-blue-50 border-blue-400 text-blue-900 hover:bg-blue-100',
  green: 'bg-green-50 border-green-400 text-green-900 hover:bg-green-100',
  gray: 'bg-gray-50 border-gray-300 text-gray-500 hover:bg-gray-100',
  amber: 'bg-amber-50 border-amber-400 text-amber-900 hover:bg-amber-100',
}

type Positioned = {
  block: CalendarBlock
  top: number
  height: number
  lane: number
  laneCount: number
}

// Assign overlapping blocks to side-by-side lanes: blocks that touch in time
// form a cluster, and every block in a cluster shares the cluster's lane count
// so widths line up.
function layoutDay(blocks: CalendarBlock[], startHour: number): Positioned[] {
  const sorted = [...blocks].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  )

  const positioned: Positioned[] = []
  let cluster: { item: Positioned; end: number }[] = []
  let laneEnds: number[] = []
  let clusterEnd = -Infinity

  const flushCluster = () => {
    for (const { item } of cluster) item.laneCount = laneEnds.length
    cluster = []
    laneEnds = []
  }

  for (const block of sorted) {
    const start = new Date(block.startsAt).getTime()
    const end = new Date(block.endsAt).getTime()
    if (start >= clusterEnd) flushCluster()
    clusterEnd = Math.max(clusterEnd, end)

    let lane = laneEnds.findIndex((laneEnd) => laneEnd <= start)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(end)
    } else {
      laneEnds[lane] = end
    }

    const startDate = new Date(block.startsAt)
    const minutesFromTop = (startDate.getHours() - startHour) * 60 + startDate.getMinutes()
    const durationMinutes = Math.max((end - start) / 60000, 20)
    const item: Positioned = {
      block,
      top: (minutesFromTop / 60) * HOUR_PX,
      height: (durationMinutes / 60) * HOUR_PX - 2,
      lane,
      laneCount: 1,
    }
    positioned.push(item)
    cluster.push({ item, end })
  }
  flushCluster()

  return positioned
}

export default function WeekCalendar({
  weekStart,
  blocks,
  onBlockClick,
}: {
  weekStart: Date
  blocks: CalendarBlock[]
  onBlockClick: (id: string) => void
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const todayKey = toLocalDateString(new Date())

  let startHour = DEFAULT_START_HOUR
  let endHour = DEFAULT_END_HOUR
  for (const block of blocks) {
    const start = new Date(block.startsAt)
    const end = new Date(block.endsAt)
    startHour = Math.min(startHour, start.getHours())
    endHour = Math.max(endHour, end.getMinutes() > 0 ? end.getHours() + 1 : end.getHours())
  }
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i)
  const bodyHeight = hours.length * HOUR_PX

  const blocksByDay = new Map<string, CalendarBlock[]>()
  for (const block of blocks) {
    const key = toLocalDateString(new Date(block.startsAt))
    blocksByDay.set(key, [...(blocksByDay.get(key) ?? []), block])
  }

  const gridCols = { gridTemplateColumns: '56px repeat(7, minmax(0, 1fr))' }

  return (
    <div className='overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm'>
      <div className='min-w-[860px]'>
        <div className='grid border-b border-gray-200' style={gridCols}>
          <div />
          {days.map((day) => {
            const isToday = toLocalDateString(day) === todayKey
            return (
              <div key={day.toISOString()} className='border-l border-gray-100 px-2 py-2 text-center'>
                <div className={`text-xs font-medium uppercase ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>
                  {day.toLocaleDateString(undefined, { weekday: 'short' })}
                </div>
                <div
                  className={`mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                    isToday ? 'bg-blue-600 text-white' : 'text-gray-900'
                  }`}
                >
                  {day.getDate()}
                </div>
              </div>
            )
          })}
        </div>

        <div className='grid' style={gridCols}>
          <div className='relative' style={{ height: bodyHeight }}>
            {hours.map((hour, i) => (
              <div
                key={hour}
                className='absolute right-2 -translate-y-1/2 text-xs text-gray-400'
                style={{ top: i * HOUR_PX }}
              >
                {i === 0
                  ? ''
                  : new Date(2000, 0, 1, hour).toLocaleTimeString(undefined, { hour: 'numeric' })}
              </div>
            ))}
          </div>

          {days.map((day) => {
            const key = toLocalDateString(day)
            const isToday = key === todayKey
            const positioned = layoutDay(blocksByDay.get(key) ?? [], startHour)
            return (
              <div
                key={key}
                className={`relative border-l border-gray-100 ${isToday ? 'bg-blue-50/40' : ''}`}
                style={{ height: bodyHeight }}
              >
                {hours.map((hour, i) => (
                  <div
                    key={hour}
                    className='absolute inset-x-0 border-t border-gray-100'
                    style={{ top: i * HOUR_PX }}
                  />
                ))}
                {positioned.map(({ block, top, height, lane, laneCount }) => (
                  <button
                    key={block.id}
                    type='button'
                    onClick={() => onBlockClick(block.id)}
                    title={`${block.title} · ${new Date(block.startsAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`}
                    className={`absolute overflow-hidden rounded-md px-1.5 py-0.5 text-left text-xs leading-tight ${
                      block.dashed ? 'border border-dashed border-l-4' : 'border-l-4'
                    } ${TONE_STYLES[block.tone]}`}
                    style={{
                      top,
                      height,
                      left: `calc(${(lane / laneCount) * 100}% + 2px)`,
                      width: `calc(${(1 / laneCount) * 100}% - 4px)`,
                    }}
                  >
                    <span className={`block truncate font-medium ${block.strike ? 'line-through' : ''}`}>
                      {block.title}
                    </span>
                    <span className='block truncate text-[11px] opacity-75'>
                      {new Date(block.startsAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                      {block.subtitle ? ` · ${block.subtitle}` : ''}
                    </span>
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
