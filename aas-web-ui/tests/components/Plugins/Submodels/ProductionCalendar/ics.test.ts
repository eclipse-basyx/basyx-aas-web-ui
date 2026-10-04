import { describe, expect, it } from 'vitest'
import { expandEvents, nowInTimeZone, parseCalendar } from '@/components/Plugins/Submodels/ProductionCalendar/ics'
import flagged from '../fixtures/production-calendar-flagged-events.ics?raw'
import line01 from '../fixtures/production-calendar-line01.ics?raw'

function expand (from: string, to: string, text = line01) {
  return expandEvents(parseCalendar(text), new Date(`${from}T00:00:00Z`), new Date(`${to}T00:00:00Z`))
}

function calendarOf (...events: string[][]): string {
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', ...events.flat(), 'END:VCALENDAR'].join('\r\n')
}

describe('parseCalendar', () => {
  it('reads name, time zone and X- properties', () => {
    const calendar = parseCalendar(line01)

    expect(calendar.name).toBe('LINE01 production calendar')
    expect(calendar.timeZone).toBe('Europe/Berlin')
    expect(calendar.events).toHaveLength(3)
    expect(calendar.xProperties.toSorted()).toEqual(['X-BREAK', 'X-MAINTENANCE', 'X-PRODUCTION-DAY'])
  })

  it('rejects text that is not an iCalendar document', () => {
    expect(() => parseCalendar('hello world')).toThrow()
    expect(() => parseCalendar('BEGIN:VEVENT\r\nEND:VEVENT')).toThrow()
  })

  it('falls back to defaults without name and time zone', () => {
    const calendar = parseCalendar('BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR')

    expect(calendar.name).toBe('Production calendar')
    expect(calendar.timeZone).toBe('UTC')
    expect(calendar.events).toEqual([])
  })
})

describe('expandEvents', () => {
  it('expands a regular week into shifts with their breaks in factory wall-clock time', () => {
    const events = expand('2026-09-13', '2026-09-21')
    const monday = events.filter(event => event.start.startsWith('2026-09-14'))

    expect(monday.map(event => [event.name, event.kind, event.start, event.end])).toEqual([
      ['Early shift', 'production', '2026-09-14 06:00', '2026-09-14 14:00'],
      ['Break', 'break', '2026-09-14 10:00', '2026-09-14 10:30'],
      ['Late shift', 'production', '2026-09-14 14:00', '2026-09-14 22:00'],
      ['Break', 'break', '2026-09-14 18:00', '2026-09-14 18:30'],
    ])
    expect(events).toHaveLength(20)
    expect(events.some(event => event.start.startsWith('2026-09-19') || event.start.startsWith('2026-09-20'))).toBe(false)
  })

  it('skips EXDATE occurrences (public holidays) including their breaks', () => {
    const events = expand('2026-05-10', '2026-05-18')
    const days = new Set(events.map(event => event.start.slice(0, 10)))

    expect([...days].toSorted()).toEqual(['2026-05-11', '2026-05-12', '2026-05-13', '2026-05-15'])
  })

  it('keeps the wall-clock time of shifts and breaks across the DST change', () => {
    const events = expand('2026-10-24', '2026-10-31')

    expect(events.filter(event => event.name === 'Early shift').map(event => event.start)).toEqual([
      '2026-10-26 06:00',
      '2026-10-27 06:00',
      '2026-10-28 06:00',
      '2026-10-29 06:00',
      '2026-10-30 06:00',
    ])
    expect(events.filter(event => event.kind === 'break' && event.start.endsWith('10:00'))).toHaveLength(5)
  })

  it('places maintenance periods inside the monthly maintenance event', () => {
    const events = expand('2026-10-01', '2026-12-01')

    expect(events.filter(event => event.kind === 'maintenance').map(event => [event.start, event.end])).toEqual([
      ['2026-10-03 06:00', '2026-10-03 10:00'],
      ['2026-11-07 06:00', '2026-11-07 10:00'],
    ])
    // The period covers the whole event, so it is shown as one maintenance event instead of a shift with an overlay
    expect(events.filter(event => event.name === 'Planned maintenance LINE01').map(event => event.kind)).toEqual([
      'maintenance',
      'maintenance',
    ])
  })

  it('keeps the metadata of the event when a period covers all of it', () => {
    const maintenance = expand('2026-10-03', '2026-10-04').find(event => event.kind === 'maintenance')

    expect(maintenance).toMatchObject({
      name: 'Planned maintenance LINE01',
      color: 'error',
      productionDay: 0,
      xProperties: ['X-PRODUCTION-DAY', 'X-MAINTENANCE'],
      description: expect.stringContaining('Monthly preventive maintenance'),
    })
  })

  it('exposes the metadata of shifts and nested periods', () => {
    const events = expand('2026-09-14', '2026-09-15')
    const shift = events.find(event => event.name === 'Early shift')
    const pause = events.find(event => event.kind === 'break')

    expect(shift).toMatchObject({
      kind: 'production',
      color: 'success',
      timed: true,
      productionDay: 0,
      xProperties: ['X-PRODUCTION-DAY', 'X-BREAK'],
      description: 'Production time slot, early shift 06:00-14:00 incl. 30 min break',
    })
    expect(pause).toMatchObject({ name: 'Break', color: 'warning', xProperties: ['X-BREAK'], description: 'During Early shift' })
  })

  it('returns nothing for a range without events', () => {
    expect(expand('2025-01-01', '2025-01-08')).toEqual([])
  })

  it('still understands calendars that mark whole events as break or maintenance', () => {
    const events = expand('2026-09-14', '2026-09-15', flagged)

    expect(events.map(event => [event.name, event.kind, event.start])).toEqual([
      ['Early shift', 'production', '2026-09-14 06:00'],
      ['Break early shift', 'break', '2026-09-14 10:00'],
      ['Late shift', 'production', '2026-09-14 14:00'],
      ['Break late shift', 'break', '2026-09-14 18:00'],
    ])
    expect(events[0]).toMatchObject({ categories: ['PRODUCTION'], productionDay: undefined })
    expect(expand('2026-10-03', '2026-10-04', flagged).find(event => event.kind === 'maintenance')?.name)
      .toBe('Planned maintenance LINE01')
  })

  describe('IDTA 02067 examples', () => {
    it('reads break periods with duration and with end (UTC)', () => {
      const text = calendarOf([
        'BEGIN:VEVENT',
        'UID:morning',
        'SUMMARY:Morning Shift',
        'DTSTART:20250310T060000Z',
        'DTEND:20250310T140000Z',
        'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;UNTIL=20250609T235959Z',
        'X-PRODUCTION-DAY:0',
        'X-BREAK:20250310T100000Z/PT30M,20250310T120000Z/20250310T121500Z',
        'END:VEVENT',
      ])
      const events = expand('2025-03-11', '2025-03-12', text)

      expect(events.map(event => [event.name, event.start, event.end])).toEqual([
        ['Morning Shift', '2025-03-11 06:00', '2025-03-11 14:00'],
        ['Break', '2025-03-11 10:00', '2025-03-11 10:30'],
        ['Break', '2025-03-11 12:00', '2025-03-11 12:15'],
      ])
      expect(expand('2025-06-10', '2025-06-12', text)).toEqual([])
    })

    it('reads break periods separated by a hyphen and across midnight', () => {
      const text = calendarOf([
        'BEGIN:VEVENT',
        'UID:night',
        'SUMMARY:Night Shift',
        'DTSTART:20240910T200000Z',
        'DTEND:20240911T050000Z',
        'RRULE:FREQ=WEEKLY;BYDAY=TU,WE,FR;UNTIL=20250425T000000Z',
        'X-BREAK:20240910T223000Z-20240910T230000Z,20240911T023000Z-20240911T030000Z',
        'END:VEVENT',
      ])
      const events = expand('2024-09-10', '2024-09-11', text)

      expect(events.map(event => [event.start, event.end])).toEqual([
        ['2024-09-10 20:00', '2024-09-11 05:00'],
        ['2024-09-10 22:30', '2024-09-10 23:00'],
        ['2024-09-11 02:30', '2024-09-11 03:00'],
      ])
    })

    it('reads the production day of overnight shifts', () => {
      const text = calendarOf(...[1, 0, -1].map(day => [
        'BEGIN:VEVENT',
        `UID:shift${day}`,
        `SUMMARY:Shift ${day}`,
        'DTSTART:20250310T220000Z',
        'DTEND:20250311T060000Z',
        `X-PRODUCTION-DAY:${day}`,
        'END:VEVENT',
      ]))

      expect(expand('2025-03-10', '2025-03-12', text).map(event => event.productionDay)).toEqual([1, 0, -1])
    })

    it('accepts underscores in the variable names and ignores unparsable values', () => {
      const text = calendarOf([
        'BEGIN:VEVENT',
        'UID:shift',
        'SUMMARY:Shift',
        'DTSTART:20250310T060000Z',
        'DTEND:20250310T140000Z',
        'X-PRODUCTION-DAY:soon',
        'X_BREAK:20250310T100000Z/PT15M,garbage,20250310/PT1H',
        'END:VEVENT',
      ])
      const events = expand('2025-03-10', '2025-03-11', text)

      expect(events.map(event => [event.name, event.start])).toEqual([
        ['Shift', '2025-03-10 06:00'],
        ['Break', '2025-03-10 10:00'],
      ])
      expect(events[0]?.productionDay).toBeUndefined()
    })
  })

  it('handles single, all-day, UTC, floating and overridden events', () => {
    const text = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'X-WR-TIMEZONE:Europe/Berlin',
      'BEGIN:VEVENT',
      'UID:holiday',
      'DTSTART;VALUE=DATE:20260706',
      'DTEND;VALUE=DATE:20260709',
      'SUMMARY:Plant holiday',
      'END:VEVENT',
      'BEGIN:VEVENT',
      'UID:utc',
      'DTSTART:20260707T040000Z',
      'DTEND:20260707T050000Z',
      'SUMMARY:UTC event',
      'END:VEVENT',
      'BEGIN:VEVENT',
      'UID:floating',
      'DTSTART:20260707T090000',
      'DURATION:PT1H',
      'SUMMARY:Floating event',
      'END:VEVENT',
      'BEGIN:VEVENT',
      'UID:daily',
      'DTSTART:20260706T060000Z',
      'DTEND:20260706T070000Z',
      'RRULE:FREQ=DAILY;COUNT=3',
      'SUMMARY:Daily',
      'END:VEVENT',
      'BEGIN:VEVENT',
      'UID:daily',
      'RECURRENCE-ID:20260707T060000Z',
      'DTSTART:20260707T080000Z',
      'DTEND:20260707T090000Z',
      'SUMMARY:Daily moved',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    const events = expand('2026-07-05', '2026-07-12', text)
    const find = (name: string) => events.find(event => event.name === name)

    expect(find('Plant holiday')).toMatchObject({ start: '2026-07-06', end: '2026-07-08', timed: false, kind: 'other' })
    expect(find('UTC event')).toMatchObject({ start: '2026-07-07 06:00', end: '2026-07-07 07:00' })
    expect(find('Floating event')).toMatchObject({ start: '2026-07-07 09:00', end: '2026-07-07 10:00' })
    expect(events.filter(event => event.uid === 'daily').map(event => [event.name, event.start])).toEqual([
      ['Daily', '2026-07-06 08:00'],
      ['Daily moved', '2026-07-07 10:00'],
      ['Daily', '2026-07-08 08:00'],
    ])
  })

  it('includes RDATE occurrences', () => {
    const text = calendarOf([
      'BEGIN:VEVENT',
      'UID:extra',
      'DTSTART:20260706T060000Z',
      'DTEND:20260706T070000Z',
      'RDATE:20260709T060000Z',
      'SUMMARY:Extra shift',
      'END:VEVENT',
    ])

    expect(expand('2026-07-05', '2026-07-12', text).map(event => event.start)).toEqual([
      '2026-07-06 06:00',
      '2026-07-09 06:00',
    ])
  })
})

describe('nowInTimeZone', () => {
  it('formats the current wall-clock time of a zone', () => {
    expect(nowInTimeZone('Europe/Berlin')).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
  })
})
