<template>
  <div class="d-flex flex-column ga-3">
    <CalendarToolbar
      v-model:view-mode="viewMode"
      :title="title"
      @next="move(1)"
      @prev="move(-1)"
      @today="goToToday"
    />

    <CalendarDayView
      v-if="viewMode === 'day'"
      :now="now"
      :timeline="timeline"
      @select="openMenu"
    />

    <v-sheet v-else border class="overflow-hidden" rounded>
      <v-calendar
        v-model="focus"
        class="border-0"
        :event-overlap-threshold="0"
        :events="visibleEvents"
        :first-day-of-week="1"
        :first-interval="hourRange.first"
        format="24hr"
        :interval-count="hourRange.count"
        :interval-height="40"
        :interval-minutes="60"
        :now="now"
        :type="viewMode"
        @click:date="openDay"
        @click:event="selectEvent"
      >
        <template v-if="viewMode === 'week'" #day-body="{ date, timeToY }">
          <div v-if="date === now.slice(0, 10)" class="calendar-now" :style="{ top: `${timeToY(now.slice(11))}px` }" />
        </template>
      </v-calendar>
    </v-sheet>

    <div class="d-flex flex-wrap align-center ga-2">
      <v-chip
        v-for="style in legend"
        :key="style.kind"
        :color="style.color"
        label
        :prepend-icon="style.icon"
        size="x-small"
        variant="tonal"
      >
        {{ style.label }}
      </v-chip>

      <v-spacer />

      <span v-if="viewMode === 'month'" class="text-body-small text-subtitleText">Breaks are shown in the day and week view</span>
    </div>

    <CalendarEventMenu v-model="menu" :event="selectedEvent" :target="menuTarget" />
  </div>
</template>

<script lang="ts" setup>
  import type { CalendarEventItem, ParsedCalendar, ViewMode } from '../types'
  import { KIND_STYLES } from '../categories'
  import { fromDateString, toDateString } from '../dates'
  import { buildDayTimeline } from '../dayTimeline'
  import { expandEvents, nowInTimeZone } from '../ics'

  const DAY_MS = 86_400_000
  const MINUTE_MS = 60_000
  const DEFAULT_HOURS = { first: 6, count: 16 }

  // Properties
  const props = defineProps<{
    calendar: ParsedCalendar
  }>()

  // Reactive state
  const viewMode = ref<ViewMode>('day')
  // The calendar is shown in the time zone of the factory, so "now" is the wall-clock time there
  const now = ref(nowInTimeZone(props.calendar.timeZone))
  const focus = ref(fromDateString(currentProductionDate()))
  const menu = ref(false)
  const selectedEvent = ref<CalendarEventItem | null>(null)
  const menuTarget = ref<HTMLElement | undefined>()
  let clock: ReturnType<typeof setInterval> | undefined

  // Computed properties
  // Events are expanded for the focused month plus a margin, which covers month grids and weeks crossing month borders.
  const events = computed(() => {
    const year = focus.value.getFullYear()
    const month = focus.value.getMonth()
    const from = new Date(Date.UTC(year, month, 1) - 8 * DAY_MS)
    const to = new Date(Date.UTC(year, month + 1, 1) + 8 * DAY_MS)
    return expandEvents(props.calendar, from, to)
  })

  const timeline = computed(() => buildDayTimeline(events.value, toDateString(focus.value)))

  const visibleEvents = computed(() => {
    return viewMode.value === 'month' ? events.value.filter(event => event.kind !== 'break') : events.value
  })

  // Show only the hours in which something happens
  const hourRange = computed(() => {
    const timed = events.value.filter(event => event.timed)
    if (timed.length === 0) {
      return DEFAULT_HOURS
    }
    const first = Math.min(...timed.map(event => Number(event.start.slice(11, 13))))
    const last = Math.max(...timed.map(event => {
      const endsNextDay = event.end.slice(0, 10) !== event.start.slice(0, 10)
      return endsNextDay ? 24 : Math.ceil(Number(event.end.slice(11, 13)) + Number(event.end.slice(14, 16)) / 60)
    }))
    const firstHour = Math.max(0, first - 1)
    return { first: firstHour, count: Math.min(24, last + 1) - firstHour }
  })

  const legend = computed(() => {
    const kinds = new Set(events.value.map(event => event.kind))
    return Object.values(KIND_STYLES).filter(style => kinds.has(style.kind))
  })

  const title = computed(() => {
    if (viewMode.value === 'day') {
      return focus.value.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    }
    if (viewMode.value === 'month') {
      return focus.value.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    }
    const start = new Date(focus.value)
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    const startText = start.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
    const endText = end.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    return `${startText} – ${endText}`
  })

  // Lifecycle hooks
  onMounted(() => {
    clock = setInterval(() => {
      now.value = nowInTimeZone(props.calendar.timeZone)
    }, MINUTE_MS)
  })

  onBeforeUnmount(() => {
    clearInterval(clock)
  })

  // Methods
  /** The production day that is running now (a night shift belongs to the day it ends on), otherwise today. */
  function currentProductionDate (): string {
    const today = now.value.slice(0, 10)
    const around = expandEvents(props.calendar, new Date(Date.parse(today) - 2 * DAY_MS), new Date(Date.parse(today) + 3 * DAY_MS))
    const running = around.find(event => event.timed && !event.parentKey && event.start <= now.value && now.value < event.end)
    return running?.productionDate ?? today
  }

  function goToToday (): void {
    now.value = nowInTimeZone(props.calendar.timeZone)
    focus.value = fromDateString(currentProductionDate())
  }

  function move (direction: 1 | -1): void {
    const { value } = focus
    focus.value = viewMode.value === 'month' ? new Date(value.getFullYear(), value.getMonth() + direction, 1) : new Date(value.getFullYear(), value.getMonth(), value.getDate() + (viewMode.value === 'week' ? 7 : 1) * direction)
  }

  function openDay (_nativeEvent: Event, { date }: { date: string }): void {
    focus.value = fromDateString(date)
    viewMode.value = 'day'
  }

  function selectEvent (nativeEvent: Event, { event }: { event: Record<string, any> }): void {
    openMenu(event as CalendarEventItem, nativeEvent.currentTarget as HTMLElement)
  }

  function openMenu (event: CalendarEventItem, target: HTMLElement): void {
    // An open menu closes on the same click (outside click handling runs asynchronously), so reopen it afterwards
    menu.value = false
    setTimeout(() => {
      selectedEvent.value = event
      menuTarget.value = target
      menu.value = true
    })
  }
</script>

<style scoped>
  .calendar-now {
    position: absolute;
    left: 0;
    right: 0;
    height: 2px;
    background: rgb(var(--v-theme-error));
    pointer-events: none;
    z-index: 2;
  }

  .calendar-now::before {
    content: '';
    position: absolute;
    left: -4px;
    top: -4px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: inherit;
  }
</style>
