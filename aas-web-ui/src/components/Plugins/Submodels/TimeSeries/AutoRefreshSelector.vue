<template>
  <v-menu
    v-model="menuOpen"
    :close-on-content-click="false"
    location="bottom end"
    width="min(340px, calc(100vw - 32px))"
  >
    <template #activator="{ props: menuProps }">
      <v-btn
        :aria-label="`Auto refresh: ${buttonLabel}`"
        :color="validationError ? 'error' : undefined"
        prepend-icon="mdi-refresh"
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
        <span>Auto Refresh</span>
        <v-spacer />

        <v-btn
          aria-label="Close auto refresh menu"
          icon="mdi-close"
          size="x-small"
          variant="text"
          @click="menuOpen = false"
        />
      </v-card-title>

      <v-card-text>
        <v-switch
          v-model="enabled"
          class="mb-3"
          color="primary"
          density="compact"
          hide-details
          label="Auto refresh"
        />

        <v-row density="compact">
          <v-col cols="7">
            <div class="text-caption mb-1">Refresh every</div>

            <v-text-field
              v-model.number="value"
              aria-label="Refresh every"
              density="compact"
              :disabled="!enabled"
              hide-details
              min="1"
              step="1"
              type="number"
              variant="outlined"
            />
          </v-col>

          <v-col cols="5">
            <div class="text-caption mb-1">Unit</div>

            <div class="d-flex ga-1">
              <v-btn
                v-for="unitOption in units"
                :key="unitOption.value"
                :active="unit === unitOption.value"
                :aria-label="unitOption.title"
                class="flex-grow-1"
                :color="unit === unitOption.value ? 'primary' : undefined"
                :disabled="!enabled"
                height="40"
                min-width="0"
                size="small"
                slim
                variant="outlined"
                @click="unit = unitOption.value"
              >
                {{ unitOption.shortTitle }}
              </v-btn>
            </div>
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
    type AutoRefreshSelection,
    type AutoRefreshUnit,
    validateAutoRefreshSelection,
  } from '@/components/Plugins/Submodels/TimeSeries/autoRefresh'

  const props = defineProps<{
    modelValue: AutoRefreshSelection
  }>()

  const emit = defineEmits<{
    'update:model-value': [value: AutoRefreshSelection]
  }>()

  const units: Array<{ shortTitle: string, title: string, value: AutoRefreshUnit }> = [
    { shortTitle: 's', title: 'Seconds', value: 'seconds' },
    { shortTitle: 'm', title: 'Minutes', value: 'minutes' },
    { shortTitle: 'h', title: 'Hours', value: 'hours' },
  ]
  const enabled = ref(props.modelValue.enabled)
  const menuOpen = ref(false)
  const value = ref(props.modelValue.value)
  const unit = ref<AutoRefreshUnit>(props.modelValue.unit)

  const selection = computed<AutoRefreshSelection>(() => ({
    enabled: enabled.value,
    value: Number(value.value),
    unit: unit.value,
  }))
  const validationError = computed(() => validateAutoRefreshSelection(selection.value))
  const buttonLabel = computed(() => {
    if (!enabled.value) {
      return 'Off'
    }

    const unitLabels: Record<AutoRefreshUnit, string> = {
      seconds: 's',
      minutes: 'm',
      hours: 'h',
    }
    return `${value.value}${unitLabels[unit.value]}`
  })

  watch(
    () => props.modelValue,
    nextValue => {
      enabled.value = nextValue.enabled
      value.value = nextValue.value
      unit.value = nextValue.unit
    },
    { deep: true },
  )

  watch(
    selection,
    nextValue => emit('update:model-value', nextValue),
    { deep: true },
  )
</script>
