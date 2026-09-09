<template>
  <v-menu
    v-model="menuOpen"
    :close-on-content-click="false"
    location="bottom end"
    width="min(400px, calc(100vw - 32px))"
  >
    <template #activator="{ props: menuProps }">
      <v-btn
        :aria-label="`Time range: ${buttonLabel}`"
        :color="validationError ? 'error' : undefined"
        prepend-icon="mdi-clock-outline"
        size="small"
        variant="tonal"
        v-bind="menuProps"
      >
        {{ buttonLabel }}
        <v-icon end>mdi-menu-down</v-icon>
      </v-btn>
    </template>

    <v-card border>
      <v-card-title class="d-flex align-center text-title-small">
        <span>Time Range</span>
        <v-spacer />

        <v-btn
          aria-label="Close time range menu"
          icon="mdi-close"
          size="x-small"
          variant="text"
          @click="menuOpen = false"
        />
      </v-card-title>

      <v-card-text>
        <v-btn-toggle
          v-model="mode"
          class="d-flex mb-3"
          color="primary"
          density="compact"
          divided
          mandatory
          variant="outlined"
        >
          <v-btn class="flex-grow-1" value="relative">Relative</v-btn>
          <v-btn class="flex-grow-1" value="absolute">Absolute</v-btn>
        </v-btn-toggle>

        <template v-if="mode === 'relative'">
          <v-row class="mb-2" density="compact">
            <v-col v-for="preset in presets" :key="preset.id" cols="3">
              <v-btn
                :active="selectedPreset === preset.id"
                :aria-label="preset.title"
                block
                :color="selectedPreset === preset.id ? 'primary' : undefined"
                size="small"
                variant="outlined"
                @click="selectedPreset = preset.id"
              >
                {{ preset.id === 'custom' ? 'Custom' : preset.id }}
              </v-btn>
            </v-col>
          </v-row>

          <v-row v-if="selectedPreset === 'custom'" density="compact">
            <v-col cols="7">
              <div class="text-caption mb-1">Range</div>

              <v-text-field
                v-model.number="relativeValue"
                aria-label="Range"
                density="compact"
                hide-details="auto"
                min="0"
                step="any"
                type="number"
                variant="outlined"
              />
            </v-col>

            <v-col cols="5">
              <div class="text-caption mb-1">Unit</div>

              <v-row density="compact">
                <v-col v-for="unit in relativeUnits" :key="unit.value" cols="3">
                  <v-btn
                    :active="relativeUnit === unit.value"
                    :aria-label="unit.title"
                    block
                    :color="relativeUnit === unit.value ? 'primary' : undefined"
                    size="small"
                    slim
                    variant="outlined"
                    @click="relativeUnit = unit.value"
                  >
                    {{ unit.shortTitle }}
                  </v-btn>
                </v-col>
              </v-row>
            </v-col>
          </v-row>
        </template>

        <v-row v-else>
          <v-col cols="12">
            <v-text-field
              v-model="absoluteStart"
              density="compact"
              hide-details="auto"
              label="From"
              type="datetime-local"
              variant="outlined"
            />
          </v-col>

          <v-col cols="12">
            <v-text-field
              v-model="absoluteStop"
              density="compact"
              hide-details="auto"
              label="To"
              type="datetime-local"
              variant="outlined"
            />
          </v-col>
        </v-row>

        <div v-if="validationError" class="text-error text-caption mt-2" role="alert">
          {{ validationError }}
        </div>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script lang="ts" setup>
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

  const relativeUnits: Array<{ shortTitle: string, title: string, value: RelativeTimeUnit }> = [
    { shortTitle: 'ms', title: 'Milliseconds', value: 'milliseconds' },
    { shortTitle: 's', title: 'Seconds', value: 'seconds' },
    { shortTitle: 'm', title: 'Minutes', value: 'minutes' },
    { shortTitle: 'h', title: 'Hours', value: 'hours' },
    { shortTitle: 'd', title: 'Days', value: 'days' },
    { shortTitle: 'w', title: 'Weeks', value: 'weeks' },
    { shortTitle: 'mo', title: 'Months', value: 'months' },
    { shortTitle: 'y', title: 'Years', value: 'years' },
  ]

  const mode = ref<TimeRangeSelection['mode']>(props.modelValue.mode)
  const menuOpen = ref(false)
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
  const buttonLabel = computed(() => {
    if (currentSelection.value.mode === 'absolute') {
      return 'Absolute range'
    }

    const unitLabels: Record<RelativeTimeUnit, string> = {
      milliseconds: 'ms',
      seconds: 's',
      minutes: 'm',
      hours: 'h',
      days: 'd',
      weeks: 'w',
      months: 'mo',
      years: 'y',
    }

    return `Last ${currentSelection.value.value}${unitLabels[currentSelection.value.unit]}`
  })

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
