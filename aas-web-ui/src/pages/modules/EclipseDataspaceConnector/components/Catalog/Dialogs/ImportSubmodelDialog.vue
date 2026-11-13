<template>
  <v-dialog v-model="importDialog" :width="800">
    <v-sheet border rounded="lg">
      <v-card-title class="bg-cardHeader">
        Import Submodel
      </v-card-title>

      <v-divider />

      <v-card-text>
        <v-alert border="start" class="mb-4" variant="tonal">
          <span>Import the Submodel </span>

          <template v-if="submodel?.idShort">
            <span class="text-primary font-weight-bold">{{ submodel.idShort }}</span>
            <span> ({{ submodel.id }})</span>
          </template>

          <span v-else class="text-primary font-weight-bold">{{ submodel?.id }}</span>
          <span> into the selected infrastructure.</span>
        </v-alert>

        <v-select
          v-model="selectedInfrastructureId"
          density="compact"
          hide-details
          item-title="name"
          item-value="id"
          :items="importInfrastructures"
          label="Select Infrastructure"
          no-data-text="No infrastructure with a Submodel Repository or AAS Environment configured"
          prepend-inner-icon="mdi-server-network"
          variant="outlined"
        >
          <template #item="{ props: itemProps, item }">
            <v-list-item v-bind="itemProps" :subtitle="getActiveComponentUrlForTemplate(item, 'SubmodelRepo')" />
          </template>
        </v-select>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />

        <v-btn
          rounded="lg"
          text="Cancel"
          @click="importDialog = false"
        />

        <v-btn
          class="text-buttonText"
          color="primary"
          :disabled="!submodel || !selectedInfrastructure"
          :loading="importing"
          prepend-icon="mdi-import"
          rounded="lg"
          text="Import"
          variant="flat"
          @click="importSubmodel()"
        />
      </v-card-actions>
    </v-sheet>
  </v-dialog>
</template>

<script lang="ts" setup>
  import type { types as aasTypes } from '@aas-core-works/aas-core3.1-typescript'
  import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient'
  import { useInfrastructureStore } from '@/store/InfrastructureStore'
  import { useNavigationStore } from '@/store/NavigationStore'
  import { getActiveComponentUrlForTemplate, isSubmodelImportInfrastructure } from '@/utils/InfrastructureUtils'

  const props = defineProps<{
    modelValue: boolean
    submodel: aasTypes.Submodel | null // Fetched Submodel to import
  }>()

  const emit = defineEmits<{
    (event: 'update:model-value', value: boolean): void
  }>()

  // Stores
  const infrastructureStore = useInfrastructureStore()
  const navigationStore = useNavigationStore()

  // Composables
  const { postSubmodel } = useSMRepositoryClient()

  // Data
  const importDialog = ref(false)
  const selectedInfrastructureId = ref<string | null>(null)
  const importing = ref(false)

  // Computed Properties
  const importInfrastructures = computed(() =>
    infrastructureStore.getInfrastructures.filter(infrastructure => isSubmodelImportInfrastructure(infrastructure)),
  )
  const selectedInfrastructure = computed(() =>
    importInfrastructures.value.find(infrastructure => infrastructure.id === selectedInfrastructureId.value) ?? null,
  )

  // Watchers
  watch(
    () => props.modelValue,
    value => {
      importDialog.value = value
      if (value) {
        selectedInfrastructureId.value = null
      }
    },
  )

  watch(
    () => importDialog.value,
    value => {
      emit('update:model-value', value)
    },
  )

  // Methods
  async function importSubmodel (): Promise<void> {
    const infrastructure = selectedInfrastructure.value
    if (!props.submodel || !infrastructure) return

    importing.value = true
    // A failed request shows its error message itself
    const success = await postSubmodel(props.submodel, false, undefined, infrastructure)
    importing.value = false
    if (!success) return

    navigationStore.dispatchSnackbar({
      status: true,
      timeout: 4000,
      color: 'success',
      btnColor: 'buttonText',
      text: `Successfully imported the Submodel into ${infrastructure.name}.`,
    })
    importDialog.value = false
  }
</script>
