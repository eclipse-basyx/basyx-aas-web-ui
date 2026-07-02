<template>
  <div class="px-3 py-3 d-flex align-center justify-space-between ga-2">
    <div class="text-subtitle-1 font-weight-medium">AAS Descriptors</div>

    <div class="d-flex align-center ga-2">
      <v-chip size="small" variant="tonal">{{ descriptorCount }} descriptors</v-chip>

      <v-tooltip location="bottom" open-delay="600">
        <template #activator="{ props: tooltipProps }">
          <v-btn
            v-bind="tooltipProps"
            aria-label="Paste copied descriptor"
            border
            color="surface-light"
            :disabled="!copiedDescriptorAvailable"
            icon="mdi-file-document-multiple-outline"
            rounded="lg"
            size="x-small"
            variant="flat"
            @click="emit('paste')"
          />
        </template>

        <span>Paste copied descriptor</span>
      </v-tooltip>

      <v-tooltip location="bottom" open-delay="600">
        <template #activator="{ props: tooltipProps }">
          <v-btn
            v-bind="tooltipProps"
            aria-label="Create descriptor"
            class="text-buttonText"
            color="primary"
            icon="mdi-plus"
            rounded="lg"
            size="x-small"
            variant="flat"
            @click="emit('create')"
          />
        </template>

        <span>Create descriptor</span>
      </v-tooltip>
    </div>
  </div>
</template>

<script lang="ts" setup>
  defineProps<{
    copiedDescriptorAvailable: boolean
    descriptorCount: number
  }>()

  const emit = defineEmits<{
    create: []
    paste: []
  }>()
</script>
