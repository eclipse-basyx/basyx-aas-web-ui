import type ICAL from 'ical.js'

export type ViewMode = 'week' | 'month'

export type EventKind = 'production' | 'break' | 'maintenance' | 'other'

export interface KindStyle {
  kind: EventKind
  label: string
  color: string
  icon: string
}

/** A single event occurrence in the shape expected by `v-calendar` (naive wall-clock times). */
export interface CalendarEventItem {
  key: string
  uid: string
  name: string
  description: string
  location: string
  /** `YYYY-MM-DD HH:mm` for timed events, `YYYY-MM-DD` for all-day events */
  start: string
  end: string
  timed: boolean
  categories: string[]
  /** Names of the X- properties set on the event (e.g. `X-BREAK`) */
  xProperties: string[]
  kind: EventKind
  color: string
}

export interface ParsedCalendar {
  name: string
  /** IANA time zone used to display the events */
  timeZone: string
  events: ICAL.Event[]
  /** Names of all X- properties found on events, upper-case */
  xProperties: string[]
}

export interface VariableSpecification {
  /** Value of the `variableName` Property */
  name: string
  /** The `variableSpecification` File element, if present */
  file?: any
}
