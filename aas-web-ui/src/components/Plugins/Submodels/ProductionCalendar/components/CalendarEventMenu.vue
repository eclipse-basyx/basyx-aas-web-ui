<template>
  <v-menu v-model="open" :close-on-content-click="false" min-width="280" :target="target">
    <v-card v-if="event">
      <v-card-title class="d-flex align-center ga-2 text-body-large">
        <v-icon :color="style.color" :icon="style.icon" />
        <span>{{ event.name }}</span>
      </v-card-title>

      <v-card-subtitle>{{ timeRange }}</v-card-subtitle>

      <v-card-text class="d-flex flex-column ga-2">
        <p v-if="event.description" class="text-body-medium">{{ event.description }}</p>

        <div v-if="event.location" class="d-flex align-center ga-2 text-body-medium">
          <v-icon icon="mdi-map-marker-outline" size="small" />
          <span>{{ event.location }}</span>
        </div>

        <div class="d-flex flex-wrap ga-1">
          <v-chip :color="style.color" size="small" variant="tonal">{{ style.label }}</v-chip>

          <v-chip v-for="category in event.categories" :key="category" size="small" variant="outlined">
            {{ category }}
          </v-chip>

          <v-chip
            v-for="property in event.xProperties"
            :key="property"
            prepend-icon="mdi-code-tags"
            size="small"
            variant="outlined"
          >
            {{ property }}
          </v-chip>
        </div>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script lang="ts" setup>
  import type { CalendarEventItem } from '../types'
  import { KIND_STYLES } from '../categories'

  // Properties
  const props = defineProps<{
    event: CalendarEventItem | null
    target?: HTMLElement
  }>()

  // Reactive state
  const open = defineModel<boolean>({ default: false })

  // Computed properties
  const style = computed(() => KIND_STYLES[props.event?.kind ?? 'other'])

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
