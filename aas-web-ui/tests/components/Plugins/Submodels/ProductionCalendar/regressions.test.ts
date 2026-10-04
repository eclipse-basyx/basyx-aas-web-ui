import { describe, expect, it } from 'vitest'
import { buildDayTimeline, timelineTicks } from '@/components/Plugins/Submodels/ProductionCalendar/dayTimeline'
import { expandEvents, parseCalendar } from '@/components/Plugins/Submodels/ProductionCalendar/ics'

function calendarOf (timeZone: string, ...events: string[][]): string {
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', `X-WR-TIMEZONE:${timeZone}`, ...events.flat(), 'END:VCALENDAR'].join('\r\n')
}

function expand (text: string, from: string, to: string) {
  const calendar = parseCalendar(text)
  return { calendar, events: expandEvents(calendar, new Date(`${from}T00:00:00Z`), new Date(`${to}T00:00:00Z`)) }
}

describe('regressions', () => {
  it('1: keeps durations and totals correct across the end of daylight saving time', () => {
    const text = calendarOf('Europe/Berlin', [
      'BEGIN:VEVENT',
      'UID:dst',
      'SUMMARY:Short shift',
      'DTSTART:20261025T003000Z',
      'DTEND:20261025T011500Z',
      'END:VEVENT',
    ])
    const { calendar, events } = expand(text, '2026-10-24', '2026-10-27')
    const timeline = buildDayTimeline(events, '2026-10-25', calendar.timeZone)
    const bar = timeline.rows[0]?.bars[0]

    expect(bar && bar.end - bar.start).toBe(45)
    expect(timeline.operating).toBe(45)
    expect(timeline.busy).toBe(45)
  })

  it('2: resolves breaks and the production day of a changed occurrence from the occurrence', () => {
    const text = calendarOf('UTC', [
      'BEGIN:VEVENT',
      'UID:shift',
      'SUMMARY:Shift',
      'DTSTART:20261005T060000Z',
      'DTEND:20261005T140000Z',
      'RRULE:FREQ=DAILY;COUNT=3',
      'X-PRODUCTION-DAY:0',
      'X-BREAK:20261005T100000Z/PT30M',
      'END:VEVENT',
      'BEGIN:VEVENT',
      'UID:shift',
      'RECURRENCE-ID:20261006T060000Z',
      'SUMMARY:Shift (changed)',
      'DTSTART:20261006T060000Z',
      'DTEND:20261006T140000Z',
      'X-PRODUCTION-DAY:1',
      'X-BREAK:20261006T120000Z/PT1H',
      'END:VEVENT',
    ])
    const { events } = expand(text, '2026-10-05', '2026-10-08')
    const changed = events.filter(event => event.start.startsWith('2026-10-06'))

    expect(changed.map(event => [event.name, event.start, event.end, event.productionDate])).toEqual([
      ['Shift (changed)', '2026-10-06 06:00', '2026-10-06 14:00', '2026-10-07'],
      ['Break', '2026-10-06 12:00', '2026-10-06 13:00', '2026-10-07'],
    ])
    // The other occurrences keep the values of the series
    expect(events.filter(event => event.kind === 'break' && !event.start.startsWith('2026-10-06')).map(event => event.start))
      .toEqual(['2026-10-05 10:00', '2026-10-07 10:00'])
  })

  it('4: shows all-day maintenance in the day timeline', () => {
    const text = calendarOf('UTC', [
      'BEGIN:VEVENT',
      'UID:plant',
      'SUMMARY:Plant maintenance',
      'DTSTART;VALUE=DATE:20261010',
      'DTEND;VALUE=DATE:20261012',
      'X-MAINTENANCE:TRUE',
      'END:VEVENT',
    ])
    const { calendar, events } = expand(text, '2026-10-09', '2026-10-14')

    const first = buildDayTimeline(events, '2026-10-10', calendar.timeZone)
    expect(first.rows.map(row => row.label)).toEqual(['Plant maintenance'])
    expect(first).toMatchObject({ maintenance: 1440, operating: 0 })
    expect(buildDayTimeline(events, '2026-10-11', calendar.timeZone).maintenance).toBe(1440)
    expect(buildDayTimeline(events, '2026-10-12', calendar.timeZone).rows).toEqual([])
  })

  it('5: finds an occurrence that was moved into the range from a later date', () => {
    const text = calendarOf('UTC', [
      'BEGIN:VEVENT',
      'UID:monthly',
      'SUMMARY:Monthly',
      'DTSTART:20260901T060000Z',
      'DTEND:20260901T140000Z',
      'RRULE:FREQ=MONTHLY;COUNT=4',
      'END:VEVENT',
      'BEGIN:VEVENT',
      'UID:monthly',
      'RECURRENCE-ID:20261201T060000Z',
      'SUMMARY:Monthly (moved)',
      'DTSTART:20261001T180000Z',
      'DTEND:20261001T200000Z',
      'END:VEVENT',
    ])
    const { events } = expand(text, '2026-10-01', '2026-11-01')

    expect(events.map(event => [event.name, event.start])).toEqual([
      ['Monthly', '2026-10-01 06:00'],
      ['Monthly (moved)', '2026-10-01 18:00'],
    ])
    // ... and it does not show up at its original date
    expect(expand(text, '2026-12-01', '2026-12-02').events).toEqual([])
  })

  it('6: applies EXDATE to the first occurrence of an RDATE-only series', () => {
    const text = calendarOf('UTC', [
      'BEGIN:VEVENT',
      'UID:extra',
      'SUMMARY:Extra shift',
      'DTSTART:20261001T060000Z',
      'DTEND:20261001T140000Z',
      'RDATE:20261002T060000Z',
      'EXDATE:20261001T060000Z',
      'END:VEVENT',
    ])
    const { events } = expand(text, '2026-10-01', '2026-10-04')

    expect(events.map(event => event.start)).toEqual(['2026-10-02 06:00'])
  })

  it('relates a changed occurrence only to the series with the same UID', () => {
    const series = (uid: string, summary: string) => [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `SUMMARY:${summary}`,
      'DTSTART:20261005T060000Z',
      'DTEND:20261005T140000Z',
      'RRULE:FREQ=DAILY;COUNT=3',
      'END:VEVENT',
    ]
    const text = calendarOf('UTC', series('a', 'Series A'), series('b', 'Series B'), [
      'BEGIN:VEVENT',
      'UID:a',
      'RECURRENCE-ID:20261006T060000Z',
      'SUMMARY:Series A (changed)',
      'DTSTART:20261006T080000Z',
      'DTEND:20261006T100000Z',
      'END:VEVENT',
    ])
    const { events } = expand(text, '2026-10-05', '2026-10-08')

    expect(events.map(event => [event.name, event.start])).toEqual([
      ['Series A', '2026-10-05 06:00'],
      ['Series B', '2026-10-05 06:00'],
      ['Series B', '2026-10-06 06:00'],
      ['Series A (changed)', '2026-10-06 08:00'],
      ['Series A', '2026-10-07 06:00'],
      ['Series B', '2026-10-07 06:00'],
    ])
  })

  it('lays out a day with 25 hours when the clocks go back', () => {
    const timeline = buildDayTimeline([], '2026-10-25', 'Europe/Berlin')

    expect(timeline.end - timeline.start).toBe(25 * 60)
    // The ticks are two real hours apart, so the labels jump when the clocks go back at 03:00
    expect(timelineTicks(timeline, 'Europe/Berlin').map(tick => tick.label).slice(0, 5)).toEqual(['00', '02', '03', '05', '07'])
  })
})
