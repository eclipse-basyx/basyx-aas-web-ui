import { describe, expect, it } from 'vitest'
import { expandEvents, parseCalendar } from '@/components/Plugins/Submodels/ProductionCalendar/ics'
import { visibleHours } from '@/components/Plugins/Submodels/ProductionCalendar/weekHours'

function eventsOf (...events: string[][]) {
  const text = ['BEGIN:VCALENDAR', 'VERSION:2.0', ...events.flat(), 'END:VCALENDAR'].join('\r\n')
  return expandEvents(parseCalendar(text), new Date('2026-10-04T00:00:00Z'), new Date('2026-10-12T00:00:00Z'))
}

function shift (start: string, end: string, rule = 'FREQ=DAILY;COUNT=3') {
  return ['BEGIN:VEVENT', `UID:${start}`, `DTSTART:${start}`, `DTEND:${end}`, `RRULE:${rule}`, 'END:VEVENT']
}

describe('visibleHours', () => {
  it('falls back to the working hours without timed events', () => {
    expect(visibleHours([])).toEqual({ first: 6, count: 16 })
  })

  it('shows the hours around a day shift', () => {
    expect(visibleHours(eventsOf(shift('20261005T060000Z', '20261005T140000Z')))).toEqual({ first: 5, count: 10 })
  })

  it('shows a shift that ends at midnight up to 24 h', () => {
    expect(visibleHours(eventsOf(shift('20261005T140000Z', '20261006T000000Z')))).toEqual({ first: 13, count: 11 })
  })

  it('includes the morning hours of the following day for a night shift', () => {
    // Only 22:00-06:00 shifts: the 00:00-06:00 part of each shift is shown in the column of the next day
    expect(visibleHours(eventsOf(shift('20261005T220000Z', '20261006T060000Z')))).toEqual({ first: 0, count: 24 })
  })

  it('shows everything for events that last longer than a day', () => {
    expect(visibleHours(eventsOf(shift('20261005T120000Z', '20261007T060000Z', 'FREQ=DAILY;COUNT=1')))).toEqual({ first: 0, count: 24 })
  })

  it('ignores all-day events', () => {
    const allDay = ['BEGIN:VEVENT', 'UID:day', 'DTSTART;VALUE=DATE:20261005', 'DTEND;VALUE=DATE:20261006', 'END:VEVENT']
    expect(visibleHours(eventsOf(allDay))).toEqual({ first: 6, count: 16 })
  })
})
