<template>
  <v-menu
    v-model="open"
    :close-on-content-click="false"
    max-width="400"
    min-width="280"
    :target="target"
  >
    <v-sheet v-if="event" border rounded="lg">
      <div class="d-flex align-center ga-2 px-4 py-2 bg-cardHeader">
        <v-icon :color="style.color" :icon="style.icon" size="small" />
        <div class="text-title-small text-break">{{ event.name }}</div>
        <v-spacer />
        <v-chip :color="style.color" label size="x-small" variant="tonal">{{ style.label }}</v-chip>
      </div>

      <v-divider />

      <div class="d-flex flex-column ga-2 pa-4 text-body-medium">
        <div class="d-flex align-center ga-2">
          <v-icon icon="mdi-clock-outline" size="16" />
          <span>{{ timeRange }}</span>
        </div>

        <div v-if="productionDayText" class="d-flex align-center ga-2">
          <v-icon icon="mdi-calendar-arrow-right" size="16" />
          <span>{{ productionDayText }}</span>
        </div>

        <div v-if="event.location" class="d-flex align-center ga-2">
          <v-icon icon="mdi-map-marker-outline" size="16" />
          <span>{{ event.location }}</span>
        </div>

        <p v-if="event.description" class="text-body-small text-subtitleText">{{ event.description }}</p>

        <div v-if="chips.length > 0" class="d-flex flex-wrap ga-1">
          <v-chip
            v-for="chip in chips"
            :key="chip"
            border
            label
            size="x-small"
          >{{ chip }}</v-chip>
        </div>
      </div>
    </v-sheet>
  </v-menu>
</template>

<script lang="ts" setup>
  import type { CalendarEventItem } from '../types'
  import { KIND_STYLES } from '../categories'

  const PRODUCTION_DAY_TEXT = {
    '-1': 'Belongs to the previous production day',
    '0': 'Belongs to the production day of its calendar day',
    '1': 'Belongs to the following production day',
  } as const

  // Properties
  const props = defineProps<{
    event: CalendarEventItem | null
    target?: HTMLElement
  }>()

  // Reactive state
  const open = defineModel<boolean>({ default: false })

  // Computed properties
  const style = computed(() => KIND_STYLES[props.event?.kind ?? 'other'])

  const chips = computed(() => [...(props.event?.categories ?? []), ...(props.event?.xProperties ?? [])])

  const productionDayText = computed(() => {
    const day = props.event?.productionDay
    return day === undefined ? '' : PRODUCTION_DAY_TEXT[day]
  })

  const timeRange = computed(() => {
    const event = props.event
    if (!event) {
      return ''
    }
    if (!event.timed) {
      return event.start === event.end ? event.start : `${event.start} – ${event.end}`
    }
    const [startDate, startTime] = event.start.split(' ')
    const [endDate, endTime] = event.end.split(' ')
    return startDate === endDate ? `${startDate}, ${startTime} – ${endTime}` : `${event.start} – ${event.end}`
  })
</script>
