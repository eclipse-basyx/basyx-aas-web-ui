<template>
  <v-dialog v-model="dialog" max-width="420" persistent>
    <v-card>
      <v-card-title class="pa-4">
        {{ title }}
      </v-card-title>

      <v-card-text class="pa-4">
        {{ message }}
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-btn variant="text" @click="dialog = false">
          {{ cancelLabel }}
        </v-btn>

        <v-btn
          :color="confirmColor"
          :loading="loading"
          variant="flat"
          @click="$emit('confirm')"
        >
          {{ confirmLabel }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  const dialog = defineModel<boolean>({ required: true })

  defineProps<{
    title: string
    message: string
    cancelLabel: string
    confirmLabel: string
    confirmColor?: string
    loading?: boolean
  }>()

  defineEmits<{ (e: 'confirm'): void }>()
</script>
