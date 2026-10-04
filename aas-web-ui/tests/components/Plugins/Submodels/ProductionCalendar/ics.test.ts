import { describe, expect, it } from 'vitest'
import { expandEvents, parseCalendar } from '@/components/Plugins/Submodels/ProductionCalendar/ics'
import line01 from '../fixtures/production-calendar-line01.ics?raw'

function expand (from: string, to: string, text = line01) {
  return expandEvents(parseCalendar(text), new Date(`${from}T00:00:00Z`), new Date(`${to}T00:00:00Z`))
}

describe('parseCalendar', () => {
  it('reads name, time zone and X- properties', () => {
    const calendar = parseCalendar(line01)

    expect(calendar.name).toBe('LINE01 production calendar')
    expect(calendar.timeZone).toBe('Europe/Berlin')
    expect(calendar.events).toHaveLength(5)
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
  it('expands a regular week into shifts and breaks in factory wall-clock time', () => {
    const events = expand('2026-09-13', '2026-09-21')
    const monday = events.filter(event => event.start.startsWith('2026-09-14'))

    expect(monday.map(event => [event.name, event.start, event.end])).toEqual([
      ['Early shift', '2026-09-14 06:00', '2026-09-14 14:00'],
      ['Break early shift', '2026-09-14 10:00', '2026-09-14 10:30'],
      ['Late shift', '2026-09-14 14:00', '2026-09-14 22:00'],
      ['Break late shift', '2026-09-14 18:00', '2026-09-14 18:30'],
    ])
    expect(events).toHaveLength(20)
    expect(events.some(event => event.start.startsWith('2026-09-19') || event.start.startsWith('2026-09-20'))).toBe(false)
  })

  it('skips EXDATE occurrences (public holidays)', () => {
    const events = expand('2026-05-10', '2026-05-18')
    const days = new Set(events.map(event => event.start.slice(0, 10)))

    expect([...days].toSorted()).toEqual(['2026-05-11', '2026-05-12', '2026-05-13', '2026-05-15'])
  })

  it('keeps the wall-clock time across the DST change', () => {
    const events = expand('2026-10-24', '2026-10-31')
    const early = events.filter(event => event.name === 'Early shift')

    expect(early.map(event => event.start)).toEqual([
      '2026-10-26 06:00',
      '2026-10-27 06:00',
      '2026-10-28 06:00',
      '2026-10-29 06:00',
      '2026-10-30 06:00',
    ])
  })

  it('expands monthly rules like the first Saturday', () => {
    const events = expand('2026-10-01', '2026-12-01').filter(event => event.kind === 'maintenance')

    expect(events.map(event => [event.start, event.end])).toEqual([
      ['2026-10-03 06:00', '2026-10-03 10:00'],
      ['2026-11-07 06:00', '2026-11-07 10:00'],
    ])
  })

  it('classifies events and exposes their metadata', () => {
    const events = expand('2026-09-14', '2026-09-15')
    const byName = Object.fromEntries(events.map(event => [event.name, event]))

    expect(byName['Early shift']).toMatchObject({
      kind: 'production',
      color: 'success',
      timed: true,
      categories: ['PRODUCTION'],
      xProperties: ['X-PRODUCTION-DAY'],
      description: 'Production time slot, early shift 06:00-14:00 incl. 30 min break',
    })
    expect(byName['Break early shift']).toMatchObject({ kind: 'break', color: 'warning' })
  })

  it('returns nothing for a range without events', () => {
    expect(expand('2025-01-01', '2025-01-08')).toEqual([])
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
    const text = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      'UID:extra',
      'DTSTART:20260706T060000Z',
      'DTEND:20260706T070000Z',
      'RDATE:20260709T060000Z',
      'SUMMARY:Extra shift',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    expect(expand('2026-07-05', '2026-07-12', text).map(event => event.start)).toEqual([
      '2026-07-06 06:00',
      '2026-07-09 06:00',
    ])
  })
})
