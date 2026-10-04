<template>
  <v-card>
    <v-card-text class="d-flex flex-column ga-3">
      <CalendarToolbar
        v-model:view-mode="viewMode"
        :title="title"
        @next="move(1)"
        @prev="move(-1)"
        @today="focus = new Date()"
      />

      <v-calendar
        v-model="focus"
        class="border rounded"
        :events="events"
        :first-day-of-week="1"
        :first-interval="hourRange.first"
        format="24hr"
        :interval-count="hourRange.count"
        :interval-height="40"
        :interval-minutes="60"
        :type="viewMode"
        @click:event="selectEvent"
      />

      <div class="d-flex flex-wrap ga-2">
        <v-chip
          v-for="style in legend"
          :key="style.kind"
          :color="style.color"
          :prepend-icon="style.icon"
          size="small"
          variant="tonal"
        >
          {{ style.label }}
        </v-chip>
      </div>
    </v-card-text>

    <CalendarEventMenu v-model="menu" :event="selectedEvent" :target="menuTarget" />
  </v-card>
</template>

<script lang="ts" setup>
  import type { CalendarEventItem, ParsedCalendar, ViewMode } from '../types'
  import { KIND_STYLES } from '../categories'
  import { expandEvents } from '../ics'

  const DAY_MS = 86_400_000
  const DEFAULT_HOURS = { first: 6, last: 22 }

  // Properties
  const props = defineProps<{
    calendar: ParsedCalendar
  }>()

  // Reactive state
  const viewMode = ref<ViewMode>('week')
  const focus = ref(new Date())
  const menu = ref(false)
  const selectedEvent = ref<CalendarEventItem | null>(null)
  const menuTarget = ref<HTMLElement | undefined>()

  // Computed properties
  // Events are expanded for the focused month plus a margin, which covers month grids and weeks crossing month borders.
  const events = computed(() => {
    const year = focus.value.getFullYear()
    const month = focus.value.getMonth()
    const from = new Date(Date.UTC(year, month, 1) - 8 * DAY_MS)
    const to = new Date(Date.UTC(year, month + 1, 1) + 8 * DAY_MS)
    return expandEvents(props.calendar, from, to)
  })

  const hourRange = computed(() => {
    const timed = events.value.filter(event => event.timed)
    if (timed.length === 0) {
      return { first: DEFAULT_HOURS.first, count: DEFAULT_HOURS.last - DEFAULT_HOURS.first }
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

  // Methods
  function move (direction: 1 | -1): void {
    focus.value = viewMode.value === 'week'
      ? new Date(focus.value.getFullYear(), focus.value.getMonth(), focus.value.getDate() + 7 * direction)
      : new Date(focus.value.getFullYear(), focus.value.getMonth() + direction, 1)
  }

  function selectEvent (nativeEvent: Event, { event }: { event: Record<string, any> }): void {
    selectedEvent.value = event as CalendarEventItem
    menuTarget.value = nativeEvent.currentTarget as HTMLElement
    menu.value = true
    nativeEvent.stopPropagation()
  }
</script>
