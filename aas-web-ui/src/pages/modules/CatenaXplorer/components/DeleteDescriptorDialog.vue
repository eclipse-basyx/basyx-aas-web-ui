<template>
  <v-dialog v-model="dialogModel" max-width="500">
    <v-card>
      <v-card-title class="bg-cardHeader">Delete AAS Descriptor</v-card-title>

      <v-divider />

      <v-card-text>
        Delete descriptor
        <span class="font-weight-medium text-break">{{ descriptor?.id }}</span>
        from the Digital Twin Registry?
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />
        <v-btn :disabled="loading" @click="dialogModel = false">Cancel</v-btn>
        <v-btn color="error" :loading="loading" @click="emit('delete')">Delete</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import { computed } from 'vue'

  const props = withDefaults(
    defineProps<{
      descriptor?: any | null
      loading?: boolean
      modelValue: boolean
    }>(),
    {
      descriptor: null,
      loading: false,
    },
  )

  const emit = defineEmits<{
    (event: 'delete'): void
    (event: 'update:model-value', value: boolean): void
  }>()

  const dialogModel = computed({
    get: () => props.modelValue,
    set: value => emit('update:model-value', value),
  })
</script>
