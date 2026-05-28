<template>
  <v-dialog
    max-width="460"
    :model-value="modelValue"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card class="pa-5" rounded="lg">
      <div class="d-flex align-center ga-3 mb-4">
        <v-avatar :color="dialogColor" variant="tonal">
          <v-icon :icon="dialogIcon" />
        </v-avatar>

        <div class="text-h6 font-weight-medium">
          {{ title }}
        </div>
      </div>

      <div class="text-body-1 text-medium-emphasis mb-6">
        {{ message }}
      </div>

      <div class="d-flex justify-end">
        <v-btn
          :color="dialogColor"
          variant="flat"
          @click="onConfirm"
        >
          {{ confirmText }}
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import { computed } from 'vue'

  const props = defineProps<{
    modelValue: boolean
    type: 'success' | 'error'
    title: string
    message: string
    confirmText?: string
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'confirm'): void
  }>()

  const dialogColor = computed(() => {
    return props.type === 'success' ? 'success' : 'error'
  })

  const dialogIcon = computed(() => {
    return props.type === 'success'
      ? 'mdi-check-circle'
      : 'mdi-alert-circle'
  })

  const confirmText = computed(() => {
    return props.confirmText ?? 'OK'
  })

  function onConfirm (): void {
    emit('update:modelValue', false)
    emit('confirm')
  }
</script>
