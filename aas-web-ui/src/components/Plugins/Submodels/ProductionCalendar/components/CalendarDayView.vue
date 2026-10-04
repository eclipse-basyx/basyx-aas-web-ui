<template>
  <div class="d-flex flex-column ga-3">
    <div class="d-flex flex-wrap ga-2">
      <v-chip
        v-for="figure in figures"
        :key="figure.label"
        :color="figure.color"
        label
        size="x-small"
        :title="figure.hint"
        variant="tonal"
      >
        {{ figure.label }}: {{ figure.value }}
      </v-chip>
    </div>

    <v-sheet border class="overflow-x-auto" rounded>
      <div class="day-view">
        <div class="day-view__overlay">
          <div
            v-for="tick in ticks"
            :key="tick.minute"
            class="day-view__line"
            :class="{ 'day-view__line--midnight': tick.midnight }"
            :style="{ left: position(tick.minute) }"
          />

          <div v-if="nowVisible" class="day-view__now" :style="{ left: position(nowMinute) }" />
        </div>

        <div />

        <div class="day-view__axis">
          <span
            v-for="tick in ticks"
            :key="tick.minute"
            class="day-view__tick text-body-small"
            :class="tick.midnight ? 'font-weight-bold' : 'text-subtitleText'"
            :style="{ left: position(tick.minute) }"
          >
            {{ tick.label }}
          </span>
        </div>

        <div class="day-view__label text-body-small font-weight-bold">Planned time</div>

        <div class="day-view__track">
          <div
            v-for="bar in timeline.combined"
            :key="bar.key"
            class="day-view__bar text-body-small"
            :class="`bg-${bar.color}`"
            :style="barStyle(bar)"
            :title="barTitle(bar)"
          >
            <span class="text-truncate">{{ formatDuration(bar.end - bar.start) }}</span>
          </div>
        </div>

        <template v-for="row in timeline.rows" :key="row.key">
          <div class="day-view__label text-body-small text-truncate" :title="row.label">{{ row.label }}</div>

          <div class="day-view__track">
            <button
              v-for="(bar, index) in row.bars"
              :key="bar.key"
              class="day-view__bar day-view__bar--button text-body-small"
              :class="[`bg-${bar.color}`, { 'day-view__bar--nested': index > 0 }]"
              :style="barStyle(bar)"
              :title="barTitle(bar)"
              type="button"
              @click="select(bar, $event)"
            >
              <span class="text-truncate">{{ barText(bar, index) }}</span>
            </button>
          </div>
        </template>
      </div>

      <div v-if="timeline.rows.length === 0" class="pa-4 text-body-medium text-subtitleText">
        Nothing is planned for this production day.
      </div>
    </v-sheet>
  </div>
</template>

<script lang="ts" setup>
  import type { DayTimeline, TimelineBar } from '../dayTimeline'
  import type { CalendarEventItem } from '../types'
  import { formatClock, formatDuration, wallClockMinutes } from '../dates'
  import { timelineTicks } from '../dayTimeline'

  const MIN_LABEL_SHARE = 0.08

  // Properties
  const props = defineProps<{
    timeline: DayTimeline
    /** Current wall-clock time (`YYYY-MM-DD HH:mm`) in the time zone of the calendar */
    now: string
  }>()

  // Emits
  const emit = defineEmits<{
    select: [event: CalendarEventItem, target: HTMLElement]
  }>()

  // Computed properties
  const ticks = computed(() => timelineTicks(props.timeline))
  const nowMinute = computed(() => wallClockMinutes(props.now))
  const nowVisible = computed(() => nowMinute.value >= props.timeline.start && nowMinute.value < props.timeline.end)

  const figures = computed(() => [
    { label: 'Planned operating time', value: formatDuration(props.timeline.operating), color: 'success', hint: 'Time covered by the shifts of this production day' },
    { label: 'Breaks', value: formatDuration(props.timeline.breaks), color: 'warning', hint: 'Planned breaks' },
    ...(props.timeline.maintenance > 0
      ? [{ label: 'Maintenance', value: formatDuration(props.timeline.maintenance), color: 'error', hint: 'Planned maintenance' }]
      : []),
    { label: 'Planned busy time', value: formatDuration(props.timeline.busy), color: undefined, hint: 'Planned operating time without breaks and maintenance (ISO 22400-2)' },
  ])

  // Methods
  function span (): number {
    return props.timeline.end - props.timeline.start
  }

  function position (minute: number): string {
    return `${((minute - props.timeline.start) / span()) * 100}%`
  }

  function barStyle (bar: TimelineBar) {
    return { left: position(bar.start), width: `${((bar.end - bar.start) / span()) * 100}%` }
  }

  /** Breaks and maintenance inside a shift are too small for a label most of the time */
  function barText (bar: TimelineBar, index: number): string {
    return index === 0 || (bar.end - bar.start) / span() >= MIN_LABEL_SHARE ? bar.label : ''
  }

  function clock (bar: TimelineBar): string {
    return `${formatClock(bar.start)}–${formatClock(bar.end)}`
  }

  function barTitle (bar: TimelineBar): string {
    return `${bar.label}, ${clock(bar)} (${formatDuration(bar.end - bar.start)})`
  }

  function select (bar: TimelineBar, event: MouseEvent): void {
    if (bar.item) {
      emit('select', bar.item, event.currentTarget as HTMLElement)
    }
  }
</script>

<style scoped>
  .day-view {
    position: relative;
    display: grid;
    grid-template-columns: 120px minmax(320px, 1fr);
    align-items: center;
    row-gap: 6px;
    padding: 0 12px 8px 0;
  }

  .day-view__overlay {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 120px;
    right: 12px;
    pointer-events: none;
  }

  .day-view__line {
    position: absolute;
    top: 0;
    bottom: 0;
    border-left: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  }

  .day-view__line--midnight {
    border-left-color: rgba(var(--v-theme-on-surface), 0.35);
  }

  .day-view__now {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    margin-left: -1px;
    background: rgb(var(--v-theme-error));
    z-index: 3;
  }

  .day-view__axis {
    position: relative;
    height: 28px;
  }

  .day-view__tick {
    position: absolute;
    top: 6px;
    transform: translateX(-50%);
  }

  .day-view__label {
    padding: 0 8px 0 12px;
  }

  .day-view__track {
    position: relative;
    height: 34px;
    border-radius: 4px;
    background: rgba(var(--v-theme-on-surface), 0.04);
  }

  .day-view__bar {
    position: absolute;
    top: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    padding: 0 6px;
    overflow: hidden;
    color: #fff;
    border: 0;
    border-radius: 4px;
    text-align: left;
  }

  .day-view__bar--button {
    cursor: pointer;
  }

  .day-view__bar--button:hover,
  .day-view__bar--button:focus-visible {
    filter: brightness(1.12);
    outline: none;
  }

  .day-view__bar--nested {
    top: 4px;
    bottom: 4px;
    z-index: 1;
    border: 1px solid rgba(0, 0, 0, 0.35);
  }
</style>
