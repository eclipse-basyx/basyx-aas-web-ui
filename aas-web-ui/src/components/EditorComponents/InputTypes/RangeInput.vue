<template>
  <div class="d-flex flex-row">
    <v-text-field
      v-model="minValue"
      bg-color="surface"
      class="mr-1"
      density="comfortable"
      label="min"
      variant="outlined"
    />

    <v-text-field
      v-model="maxValue"
      bg-color="surface"
      class="ml-1"
      density="comfortable"
      label="max"
      variant="outlined"
    />
  </div>
</template>

<script lang="ts" setup>
  import { ref, watch } from 'vue'

  const props = defineProps<{
    minValue: string | null
    maxValue: string | null
  }>()

  const emit = defineEmits<{
    'update:min-value': [value: string | null]
    'update:max-value': [value: string | null]
  }>()

  const minValue = ref<string | null>(props.minValue)
  const maxValue = ref<string | null>(props.maxValue)

  watch(minValue, newValue => {
    if (newValue === '') {
      emit('update:min-value', null)
    } else {
      emit('update:min-value', newValue)
    }
  })

  watch(maxValue, newValue => {
    if (newValue === '') {
      emit('update:max-value', null)
    } else {
      emit('update:max-value', newValue)
    }
  })

  watch(
    () => props.minValue,
    newValue => {
      minValue.value = newValue
    },
  )

  watch(
    () => props.maxValue,
    newValue => {
      maxValue.value = newValue
    },
  )
</script>
