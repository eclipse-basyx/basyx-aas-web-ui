<template>
  <v-sheet border rounded="lg">
    <v-card-title class="bg-cardHeader">Share a resource</v-card-title>
    <v-divider />

    <v-card-text>
      <v-alert
        class="mb-4"
        density="compact"
        icon="mdi-lightbulb-outline"
        type="info"
        variant="tonal"
      >
        You can also open <strong>Share</strong> from the menu of a shell, Submodel or element in the viewer.
      </v-alert>

      <v-select
        v-model="kind"
        class="mb-2"
        density="compact"
        :items="options"
        label="Resource type"
        variant="outlined"
      />

      <v-text-field
        v-if="kind !== 'submodel-element'"
        v-model="resourceId"
        class="mb-2"
        density="compact"
        :label="resourceIdLabel"
        variant="outlined"
      />

      <template v-else>
        <v-text-field
          v-model="submodelId"
          class="mb-2"
          density="compact"
          label="Submodel ID"
          variant="outlined"
        />

        <v-text-field
          v-model="idShortPath"
          class="mb-2"
          density="compact"
          hint="For example TechnicalData.GeneralInformation or Items[0]"
          label="idShort path"
          persistent-hint
          variant="outlined"
        />
      </template>

      <v-alert
        v-if="formError"
        class="mt-2"
        density="compact"
        :text="formError"
        type="error"
        variant="tonal"
      />
    </v-card-text>

    <v-divider />

    <v-card-actions>
      <v-spacer />

      <v-btn
        class="text-buttonText"
        color="primary"
        :disabled="!canOpen"
        prepend-icon="mdi-account-plus-outline"
        rounded="lg"
        text="Share"
        variant="flat"
        @click="openAccess"
      />
    </v-card-actions>

    <ResourceAccessDialog v-model="dialog" :target="target" />
  </v-sheet>
</template>

<script setup lang="ts">
  import type { ResourceAccessTarget, ResourceAccessTargetKind } from '@/types/ResourceAccess'
  import { useInfrastructureStore } from '@/store/InfrastructureStore'
  import { buildResourceAccessTarget, resourceAccessTargetOptions, resourceAccessTargets } from '@/utils/ResourceAccessTargets'

  const infrastructureStore = useInfrastructureStore()

  const kind = ref<ResourceAccessTargetKind>('aas')
  const resourceId = ref('')
  const submodelId = ref('')
  const idShortPath = ref('')
  const target = ref<ResourceAccessTarget>()
  const dialog = ref(false)
  const formError = ref('')

  const options = computed(() => resourceAccessTargetOptions.filter(option => infrastructureStore.supportsResourceAccess(option.componentKey)))
  const resourceIdLabel = computed(() => {
    if (['aas', 'aas-descriptor', 'discovery'].includes(kind.value)) return 'AAS ID'
    if (kind.value === 'concept-description') return 'Concept Description ID'
    return 'Submodel ID'
  })
  const canOpen = computed(() => kind.value === 'submodel-element'
    ? Boolean(submodelId.value.trim() && idShortPath.value.trim())
    : Boolean(resourceId.value.trim()))

  watch(options, available => {
    if (!available.some(option => option.value === kind.value) && available[0]) kind.value = available[0].value
  }, { immediate: true })

  watch(kind, () => {
    formError.value = ''
  })

  function openAccess (): void {
    formError.value = ''
    const componentKey = resourceAccessTargets[kind.value].componentKey
    try {
      target.value = buildResourceAccessTarget({
        kind: kind.value,
        baseUrl: infrastructureStore.getSelectedInfrastructure?.components[componentKey]?.url ?? '',
        resourceId: resourceId.value,
        submodelId: submodelId.value,
        idShortPath: idShortPath.value,
      })
      dialog.value = true
    } catch (error) {
      formError.value = error instanceof Error ? error.message : String(error)
    }
  }
</script>
