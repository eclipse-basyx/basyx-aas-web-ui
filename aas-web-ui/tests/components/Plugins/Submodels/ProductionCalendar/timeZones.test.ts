import { describe, expect, it } from 'vitest'
import {
  absoluteMinutes,
  ceilToLocalHour,
  clockAt,
  floorToLocalHour,
  formatInstant,
  isValidTimeZone,
  zonedToAbsolute,
} from '@/components/Plugins/Submodels/ProductionCalendar/timeZones'

const BERLIN = 'Europe/Berlin'

function utc (iso: string): number {
  return absoluteMinutes(Date.parse(iso))
}

describe('time zones', () => {
  it('validates time zones', () => {
    expect(isValidTimeZone(BERLIN)).toBe(true)
    expect(isValidTimeZone('Nowhere/Land')).toBe(false)
  })

  it('formats wall-clock times of a zone', () => {
    expect(formatInstant(Date.parse('2026-07-01T10:00:00Z'), BERLIN)).toBe('2026-07-01 12:00')
    expect(formatInstant(Date.parse('2026-12-01T10:00:00Z'), BERLIN)).toBe('2026-12-01 11:00')
  })

  it('converts wall-clock times to absolute minutes in summer and winter time', () => {
    expect(zonedToAbsolute('2026-07-01 12:00', BERLIN)).toBe(utc('2026-07-01T10:00:00Z'))
    expect(zonedToAbsolute('2026-12-01 12:00', BERLIN)).toBe(utc('2026-12-01T11:00:00Z'))
    expect(zonedToAbsolute('2026-12-01', BERLIN)).toBe(utc('2026-11-30T23:00:00Z'))
  })

  it('converts correctly next to the end of daylight saving time', () => {
    expect(zonedToAbsolute('2026-10-25 00:00', BERLIN)).toBe(utc('2026-10-24T22:00:00Z'))
    expect(zonedToAbsolute('2026-10-26 00:00', BERLIN)).toBe(utc('2026-10-25T23:00:00Z'))
    // The day has 25 hours
    expect(zonedToAbsolute('2026-10-26', BERLIN) - zonedToAbsolute('2026-10-25', BERLIN)).toBe(25 * 60)
    expect(zonedToAbsolute('2026-03-29 23:00', BERLIN) - zonedToAbsolute('2026-03-29 00:00', BERLIN)).toBe(22 * 60)
  })

  it('reads the clock of absolute minutes', () => {
    expect(clockAt(utc('2026-10-25T00:30:00Z'), BERLIN)).toBe('02:30')
    expect(clockAt(utc('2026-10-25T01:15:00Z'), BERLIN)).toBe('02:15')
  })

  it('aligns to local hours, also for zones with a half-hour offset', () => {
    const kolkata = 'Asia/Kolkata'
    const minute = utc('2026-10-01T10:20:00Z')

    expect(clockAt(floorToLocalHour(minute, kolkata), kolkata)).toBe('15:00')
    expect(clockAt(ceilToLocalHour(minute, kolkata), kolkata)).toBe('16:00')
    expect(ceilToLocalHour(floorToLocalHour(minute, kolkata), kolkata)).toBe(floorToLocalHour(minute, kolkata))
  })
})
