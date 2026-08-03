<template>
  <div>
    <div class="text-title-small mb-2">Time Range</div>

    <v-btn-toggle
      v-model="mode"
      class="mb-3"
      color="primary"
      density="compact"
      divided
      mandatory
      variant="outlined"
    >
      <v-btn value="relative">Relative</v-btn>
      <v-btn value="absolute">Absolute</v-btn>
    </v-btn-toggle>

    <template v-if="mode === 'relative'">
      <v-select
        v-model="selectedPreset"
        density="compact"
        item-title="title"
        item-value="id"
        :items="presets"
        label="Time range"
        variant="outlined"
      />

      <v-row v-if="selectedPreset === 'custom'">
        <v-col cols="12" md="6">
          <v-text-field
            v-model.number="relativeValue"
            density="compact"
            label="Range"
            min="0"
            step="any"
            type="number"
            variant="outlined"
          />
        </v-col>

        <v-col cols="12" md="6">
          <v-select
            v-model="relativeUnit"
            density="compact"
            item-title="title"
            item-value="value"
            :items="relativeUnits"
            label="Unit"
            variant="outlined"
          />
        </v-col>
      </v-row>
    </template>

    <v-row v-else>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="absoluteStart"
          density="compact"
          label="From"
          type="datetime-local"
          variant="outlined"
        />
      </v-col>

      <v-col cols="12" md="6">
        <v-text-field
          v-model="absoluteStop"
          density="compact"
          label="To"
          type="datetime-local"
          variant="outlined"
        />
      </v-col>
    </v-row>

    <div v-if="validationError" class="text-error text-caption mt-n2 mb-2" role="alert">
      {{ validationError }}
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, ref, watch } from 'vue'
  import {
    cloneTimeRangeSelection,
    type RelativeTimeUnit,
    type TimeRangeSelection,
    validateTimeRangeSelection,
  } from './timeRange'

  type Preset = {
    id: string
    title: string
    value?: number
    unit?: RelativeTimeUnit
  }

  const props = defineProps<{
    modelValue: TimeRangeSelection
  }>()

  const emit = defineEmits<{
    'update:model-value': [value: TimeRangeSelection]
  }>()

  const presets: Preset[] = [
    { id: '1m', title: 'Last 1 minute', value: 1, unit: 'minutes' },
    { id: '5m', title: 'Last 5 minutes', value: 5, unit: 'minutes' },
    { id: '15m', title: 'Last 15 minutes', value: 15, unit: 'minutes' },
    { id: '1h', title: 'Last 1 hour', value: 1, unit: 'hours' },
    { id: '6h', title: 'Last 6 hours', value: 6, unit: 'hours' },
    { id: '12h', title: 'Last 12 hours', value: 12, unit: 'hours' },
    { id: '24h', title: 'Last 24 hours', value: 24, unit: 'hours' },
    { id: '7d', title: 'Last 7 days', value: 7, unit: 'days' },
    { id: '30d', title: 'Last 30 days', value: 30, unit: 'days' },
    { id: '1y', title: 'Last 1 year', value: 1, unit: 'years' },
    { id: 'custom', title: 'Custom relative range' },
  ]

  const relativeUnits: Array<{ title: string, value: RelativeTimeUnit }> = [
    { title: 'Milliseconds', value: 'milliseconds' },
    { title: 'Seconds', value: 'seconds' },
    { title: 'Minutes', value: 'minutes' },
    { title: 'Hours', value: 'hours' },
    { title: 'Days', value: 'days' },
    { title: 'Weeks', value: 'weeks' },
    { title: 'Months', value: 'months' },
    { title: 'Years', value: 'years' },
  ]

  const mode = ref<TimeRangeSelection['mode']>(props.modelValue.mode)
  const selectedPreset = ref(findPreset(props.modelValue))
  const relativeValue = ref(props.modelValue.mode === 'relative' ? props.modelValue.value : 1)
  const relativeUnit = ref<RelativeTimeUnit>(props.modelValue.mode === 'relative' ? props.modelValue.unit : 'minutes')
  const absoluteStart = ref(props.modelValue.mode === 'absolute' ? props.modelValue.start : '')
  const absoluteStop = ref(props.modelValue.mode === 'absolute' ? props.modelValue.stop : '')

  const currentSelection = computed<TimeRangeSelection>(() => {
    if (mode.value === 'absolute') {
      return {
        mode: 'absolute',
        start: absoluteStart.value,
        stop: absoluteStop.value,
      }
    }

    const preset = presets.find(item => item.id === selectedPreset.value)
    if (preset?.value && preset.unit) {
      return {
        mode: 'relative',
        value: preset.value,
        unit: preset.unit,
      }
    }

    return {
      mode: 'relative',
      value: Number(relativeValue.value),
      unit: relativeUnit.value,
    }
  })

  const validationError = computed(() => validateTimeRangeSelection(currentSelection.value))

  watch(
    currentSelection,
    selection => emit('update:model-value', cloneTimeRangeSelection(selection)),
    { deep: true },
  )

  watch(
    () => props.modelValue,
    selection => {
      if (JSON.stringify(selection) === JSON.stringify(currentSelection.value)) {
        return
      }

      mode.value = selection.mode
      selectedPreset.value = findPreset(selection)
      if (selection.mode === 'relative') {
        relativeValue.value = selection.value
        relativeUnit.value = selection.unit
      } else {
        absoluteStart.value = selection.start
        absoluteStop.value = selection.stop
      }
    },
    { deep: true },
  )

  function findPreset (selection: TimeRangeSelection): string {
    if (selection.mode === 'absolute') {
      return 'custom'
    }

    return presets.find(preset => preset.value === selection.value && preset.unit === selection.unit)?.id || 'custom'
  }
</script>
