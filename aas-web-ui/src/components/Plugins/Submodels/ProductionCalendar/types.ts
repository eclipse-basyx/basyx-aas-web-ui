import type ICAL from 'ical.js'

export type ViewMode = 'day' | 'week' | 'month'

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
  /** Value of `X-PRODUCTION-DAY`: the event belongs to the previous (-1), same (0) or next (1) production day */
  productionDay?: -1 | 0 | 1
  /** `YYYY-MM-DD` of the production day the event belongs to */
  productionDate: string
  /** Key of the shift a break or maintenance period lies in */
  parentKey?: string
}

export interface ParsedCalendar {
  name: string
  /** IANA time zone used to display the events */
  timeZone: string
  events: ICAL.Event[]
  /** Normalized names (see `normalizeVariableName`) of all X- properties found on events */
  xProperties: string[]
}

export interface VariableSpecification {
  /** Value of the `variableName` Property */
  name: string
  /** The `variableSpecification` File element, if present */
  file?: any
}
