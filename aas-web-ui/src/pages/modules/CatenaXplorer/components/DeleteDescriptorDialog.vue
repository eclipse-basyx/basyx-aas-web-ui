<template>
  <v-dialog
    v-model="dialogModel"
    :fullscreen="smAndDown"
    max-width="500"
  >
    <v-sheet
      :border="!smAndDown"
      :rounded="smAndDown ? undefined : 'lg'"
      :style="smAndDown ? { height: '100vh' } : undefined"
    >
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
        <v-btn :disabled="loading" rounded="lg" text="Cancel" @click="dialogModel = false" />

        <v-btn
          class="text-buttonText"
          color="error"
          :loading="loading"
          rounded="lg"
          text="Delete"
          variant="flat"
          @click="emit('delete')"
        />
      </v-card-actions>
    </v-sheet>
  </v-dialog>
</template>

<script lang="ts" setup>
  import { computed } from 'vue'
  import { useDisplay } from 'vuetify'

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

  const { smAndDown } = useDisplay()

  const dialogModel = computed({
    get: () => props.modelValue,
    set: value => emit('update:model-value', value),
  })
</script>
