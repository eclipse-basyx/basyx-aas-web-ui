import { describe, expect, it } from 'vitest'
import { buildDayTimeline, timelineTicks } from '@/components/Plugins/Submodels/ProductionCalendar/dayTimeline'
import { expandEvents, parseCalendar } from '@/components/Plugins/Submodels/ProductionCalendar/ics'
import { zonedToAbsolute } from '@/components/Plugins/Submodels/ProductionCalendar/timeZones'
import line01 from '../fixtures/production-calendar-line01.ics?raw'

const calendar = parseCalendar(line01)
const events = expandEvents(calendar, new Date('2026-09-01T00:00:00Z'), new Date('2026-11-15T00:00:00Z'))

const zone = calendar.timeZone

function minutes (wallClock: string): number {
  return zonedToAbsolute(wallClock, zone)
}

describe('buildDayTimeline', () => {
  it('lays out the three shifts of a production day, including the night shift of the evening before', () => {
    const timeline = buildDayTimeline(events, '2026-09-14', zone)

    expect(timeline.rows.map(row => [row.label, row.bars[0]?.start, row.bars[0]?.end])).toEqual([
      ['Night shift', minutes('2026-09-13 22:00'), minutes('2026-09-14 06:00')],
      ['Early shift', minutes('2026-09-14 06:00'), minutes('2026-09-14 14:00')],
      ['Late shift', minutes('2026-09-14 14:00'), minutes('2026-09-14 22:00')],
    ])
    expect(timeline.start).toBe(minutes('2026-09-13 22:00'))
    expect(timeline.end).toBe(minutes('2026-09-15 00:00'))
  })

  it('puts the breaks into the row of their shift', () => {
    const early = buildDayTimeline(events, '2026-09-14', zone).rows.find(row => row.label === 'Early shift')

    expect(early?.bars.map(bar => [bar.kind, bar.start, bar.end])).toEqual([
      ['production', minutes('2026-09-14 06:00'), minutes('2026-09-14 14:00')],
      ['break', minutes('2026-09-14 10:00'), minutes('2026-09-14 10:30')],
    ])
  })

  it('combines the rows into planned time, breaks and maintenance without overlaps', () => {
    const timeline = buildDayTimeline(events, '2026-09-14', zone)

    expect(timeline.combined.map(bar => [bar.kind, bar.start, bar.end])).toEqual([
      ['production', minutes('2026-09-13 22:00'), minutes('2026-09-14 02:00')],
      ['break', minutes('2026-09-14 02:00'), minutes('2026-09-14 02:30')],
      ['production', minutes('2026-09-14 02:30'), minutes('2026-09-14 10:00')],
      ['break', minutes('2026-09-14 10:00'), minutes('2026-09-14 10:30')],
      ['production', minutes('2026-09-14 10:30'), minutes('2026-09-14 18:00')],
      ['break', minutes('2026-09-14 18:00'), minutes('2026-09-14 18:30')],
      ['production', minutes('2026-09-14 18:30'), minutes('2026-09-14 22:00')],
    ])
    expect(timeline).toMatchObject({ operating: 24 * 60, breaks: 90, maintenance: 0, busy: 24 * 60 - 90 })
  })

  it('handles a shift that is nested in maintenance and a shortened shift', () => {
    const saturday = buildDayTimeline(events, '2026-10-03', zone)
    expect(saturday.combined.map(bar => [bar.kind, bar.end - bar.start])).toEqual([
      ['maintenance', 240],
      ['production', 240],
    ])
    expect(saturday).toMatchObject({ operating: 480, maintenance: 240, busy: 240 })

    const friday = buildDayTimeline(events, '2026-10-09', zone)
    expect(friday.rows.map(row => row.label)).toEqual(['Night shift', 'Early shift', 'Late shift (shortened)'])
    expect(friday.rows.at(-1)?.bars).toHaveLength(1)
  })

  it('has no rows on days without production and still shows the calendar day', () => {
    const timeline = buildDayTimeline(events, '2026-09-13', zone)

    expect(timeline.rows.map(row => row.label)).toEqual([])
    expect(timeline).toMatchObject({ start: minutes('2026-09-13 00:00'), end: minutes('2026-09-14 00:00'), operating: 0 })
  })

  it('does not show events of other production days', () => {
    // Monday 2026-09-14: the night shift that starts on Monday evening belongs to Tuesday
    const rows = buildDayTimeline(events, '2026-09-14', zone).rows
    expect(rows.some(row => row.bars[0]?.start === minutes('2026-09-14 22:00'))).toBe(false)
  })
})

describe('timelineTicks', () => {
  it('marks every second hour of a day and spares the labels of longer windows', () => {
    const day = timelineTicks(buildDayTimeline(events, '2026-09-13', zone), zone)
    expect(day).toHaveLength(13)
    expect(day[0]).toEqual({ minute: minutes('2026-09-13 00:00'), label: '00', midnight: true })

    const monday = timelineTicks(buildDayTimeline(events, '2026-09-14', zone), zone)
    expect(monday.map(tick => tick.label).slice(0, 4)).toEqual(['22', '00', '02', '04'])
    expect(monday.filter(tick => tick.midnight)).toHaveLength(2)
  })
})
