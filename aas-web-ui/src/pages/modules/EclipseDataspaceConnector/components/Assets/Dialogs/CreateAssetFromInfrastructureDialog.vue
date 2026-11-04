<template>
  <v-dialog v-model="createAssetDialog" height="90%" style="max-width: 1920px" width="90%">
    <v-sheet border class="d-flex flex-column" height="100%" rounded="lg">
      <v-card-title class="bg-cardHeader">
        Create Asset from AAS Infrastructure
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-0 overflow-y-auto flex-grow-1">

        <v-layout :style="{ 'height': fullHeight }">

          <InfrastructureSelectionDrawers
            v-model:aas="selectedAas"
            v-model:infrastructure-id="selectedInfrastructureId"
            v-model:submodels="selectedSubmodels"
          />

          <EdcAssetOAuth2Drawer v-model="oauth2Drawer">
            <EdcAssetOAuth2Fields
              v-model="aasOAuth2"
              subtitle="Used by the data address of the AAS asset"
              title="Asset of AAS"
            />

            <v-divider />

            <EdcAssetOAuth2Fields
              v-model="smOAuth2"
              subtitle="Used by the data addresses of all Submodel assets"
              title="Assets of Submodels"
            />
          </EdcAssetOAuth2Drawer>

          <v-main class="py-0">
            <v-container class="ma-0 pa-0 d-flex flex-column" fluid :style="{ 'height': fullHeight }">

              <!-- Offset by the drawer header, so the empty state aligns with the one of the Submodel List -->
              <div
                v-if="!selectedAas"
                class="d-flex align-center justify-center"
                :style="{ 'height': fullHeight, 'padding-top': drawerHeaderHeight }"
              >
                <v-empty-state
                  :class="{ 'text-divider': !selectedInfrastructureId }"
                  icon="mdi-gesture-tap"
                  text="Select an AAS to register as Asset."
                  title="Select AAS"
                >
                  <template #media>
                    <v-icon :color="selectedInfrastructureId ? undefined : 'divider'" size="64" />
                  </template>
                </v-empty-state>
              </div>

              <template v-else>
                <!-- Preview of the selected AAS and each selected Submodel (1/3 of the height) -->
                <JsonPreviewTabs v-model="previewTab" :items="dataTabs" style="flex: 1 1 0">
                  <template #append>
                    <EdcAssetOAuth2Button v-model="oauth2Drawer" :configured="oauth2Configured" />
                  </template>
                </JsonPreviewTabs>

                <v-divider />

                <!-- Preview of the Asset of the AAS or Submodel selected in the tab bar above (2/3 of the height) -->
                <JsonPreviewTabs v-model="previewTab" hide-tabs :items="edcAssetTabs" style="flex: 2 1 0" />
              </template>

            </v-container>
          </v-main>

        </v-layout>

      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />

        <v-btn
          rounded="lg"
          text="Cancel"
          @click="createAssetDialog = false"
        />

        <v-btn
          class="text-buttonText"
          color="primary"
          :disabled="!selectedAas"
          :loading="creatingAssets"
          rounded="lg"
          text="Create"
          variant="flat"
          @click="createEdcAssets"
        />
      </v-card-actions>
    </v-sheet>
  </v-dialog>
</template>

<script lang="ts" setup>
  import type { JsonPreviewTab } from '@/pages/modules/EclipseDataspaceConnector/components/Assets/JsonPreviewTabs.vue'
  import { useSubmodelDisplay } from '@/composables/AAS/SubmodelDisplay'
  import { useCatenaXEdcClient } from '@/composables/Client/CatenaXEdcClient'
  import EdcAssetOAuth2Button from '@/pages/modules/EclipseDataspaceConnector/components/Assets/EdcAssetOAuth2Button.vue'
  import EdcAssetOAuth2Drawer from '@/pages/modules/EclipseDataspaceConnector/components/Assets/EdcAssetOAuth2Drawer.vue'
  import EdcAssetOAuth2Fields from '@/pages/modules/EclipseDataspaceConnector/components/Assets/EdcAssetOAuth2Fields.vue'
  import JsonPreviewTabs from '@/pages/modules/EclipseDataspaceConnector/components/Assets/JsonPreviewTabs.vue'
  import InfrastructureSelectionDrawers from '@/pages/modules/EclipseDataspaceConnector/components/Shared/InfrastructureSelectionDrawers.vue'
  import {
    createEmptyEdcAssetOAuth2,
    type EdcAssetOAuth2,
    hasEdcAssetOAuth2,
    useEdcAssetFromAas,
  } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcAssetFromAas'
  import {
    edcRequestFailureText,
    useEdcRequestFailureMessage,
  } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcRequestFailure'
  import { useNavigationStore } from '@/store/NavigationStore'

  const props = withDefaults(defineProps<{
    modelValue: boolean
    proxyId?: string
  }>(), {
    proxyId: 'default',
  })

  const emit = defineEmits<{
    (event: 'update:model-value', value: boolean): void
    (event: 'assets-created', assetId?: string): void
  }>()

  // Stores
  const navigationStore = useNavigationStore()

  // Composables
  const { smTitleToDisplay } = useSubmodelDisplay()
  const { createAasEdcAsset, createSmEdcAsset } = useEdcAssetFromAas()
  const { createAsset: createAssetInEdc } = useCatenaXEdcClient()
  const { showFailureMessage } = useEdcRequestFailureMessage()

  // Data
  const createAssetDialog = ref(false)
  const fullHeight = 'calc(90vh - 52px - 52px - 2px)' // dialog - dialog header - dialog footer - 2x divider
  const drawerHeaderHeight = '113px' // selection field (8px + 40px) + list title bar (64px) + divider (1px)
  const selectedInfrastructureId = ref<string | null>(null)
  const selectedAas = ref<any>(null)
  const selectedSubmodels = ref<Array<any>>([])
  const previewTab = ref<string>('aas') // Tab of both previews: 'aas' or the ID of a selected Submodel
  const oauth2Drawer = ref(false)
  const aasOAuth2 = ref<EdcAssetOAuth2>(createEmptyEdcAssetOAuth2()) // OAuth2 of the AAS Repository
  const smOAuth2 = ref<EdcAssetOAuth2>(createEmptyEdcAssetOAuth2()) // OAuth2 of the Submodel Repository
  const creatingAssets = ref(false)

  // Computed Properties
  const dataTabs = computed<Array<JsonPreviewTab>>(() => [
    { value: 'aas', title: 'AAS', previewTitle: 'AAS', icon: 'custom:aasIcon', json: selectedAas.value?.aas },
    ...selectedSubmodels.value.map(submodel => ({
      value: submodel.id,
      title: smTitleToDisplay(submodel),
      previewTitle: 'Submodel',
      json: submodel,
    })),
  ])
  const edcAssetTabs = computed<Array<JsonPreviewTab>>(() => [
    {
      value: 'aas',
      title: 'AAS',
      previewTitle: 'Asset of AAS',
      previewIcon: 'custom:edcIcon',
      icon: 'custom:aasIcon',
      json: createAasEdcAsset(selectedAas.value, aasOAuth2.value),
    },
    ...selectedSubmodels.value.map(submodel => ({
      value: submodel.id,
      title: smTitleToDisplay(submodel),
      previewTitle: 'Asset of Submodel',
      previewIcon: 'custom:edcIcon',
      json: createSmEdcAsset(selectedAas.value, submodel, smOAuth2.value),
    })),
  ])

  const oauth2Configured = computed(() => hasEdcAssetOAuth2(aasOAuth2.value) || hasEdcAssetOAuth2(smOAuth2.value))

  // Watchers
  watch(
    () => props.modelValue,
    value => {
      createAssetDialog.value = value
      if (!value) {
        selectedInfrastructureId.value = null
        oauth2Drawer.value = false
      }
    },
  )

  watch(
    () => selectedInfrastructureId.value,
    () => {
      // OAuth2 values belong to the repositories of an infrastructure
      aasOAuth2.value = createEmptyEdcAssetOAuth2()
      smOAuth2.value = createEmptyEdcAssetOAuth2()
    },
  )

  watch(
    () => selectedSubmodels.value,
    (submodels, previousSubmodels) => {
      // Preview a newly selected Submodel, fall back to the AAS when the previewed one is deselected
      const addedSubmodel = submodels.find(submodel => !previousSubmodels.some(previous => previous.id === submodel.id))
      if (addedSubmodel) {
        previewTab.value = addedSubmodel.id
      } else if (!submodels.some(submodel => submodel.id === previewTab.value)) {
        previewTab.value = 'aas'
      }
    },
  )

  watch(
    () => createAssetDialog.value,
    value => {
      emit('update:model-value', value)
    },
  )

  // Methods
  async function createEdcAssets (): Promise<void> {
    if (!selectedAas.value) return

    const edcAssets = [
      { name: 'AAS', asset: createAasEdcAsset(selectedAas.value, aasOAuth2.value) },
      ...selectedSubmodels.value.map(submodel => ({
        name: 'Submodel ' + smTitleToDisplay(submodel),
        asset: createSmEdcAsset(selectedAas.value, submodel, smOAuth2.value),
      })),
    ].filter((edcAsset, index, all) =>
      // Create each ID once, the EDC fails unpredictably on parallel requests with the same ID
      all.findIndex(other => other.asset['@id'] === edcAsset.asset['@id']) === index,
    )

    creatingAssets.value = true
    const results = await Promise.all(edcAssets.map(({ asset }) => createAssetInEdc(props.proxyId, asset)))
    creatingAssets.value = false

    // An already existing asset (409) is no failure, e.g. of a Submodel shared by several AAS
    const failures = edcAssets.flatMap(({ name }, index) => {
      const result = results[index]
      return !result || result.success || result.status === 409 ? [] : [{ name, result }]
    })
    const createdCount = results.filter(result => result?.success).length
    const existingCount = results.length - createdCount - failures.length
    const failedCount = failures.length
    const summary = createSummary(createdCount, existingCount, failedCount)

    if (failedCount === 0) {
      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 4000,
        color: createdCount === 0 ? 'info' : 'success',
        btnColor: 'buttonText',
        text: summary,
      })
    } else {
      showFailureMessage(
        summary,
        failures.map(({ name, result }) => `${name}:\n${edcRequestFailureText(result, 'Asset', 'create')}`).join('\n\n'),
        createdCount + existingCount === 0 ? 'error' : 'warning',
      )
    }

    if (failedCount === 0) {
      // Select the Asset of the AAS, created or already existing
      emit('assets-created', edcAssets[0]?.asset['@id'])
      createAssetDialog.value = false
    } else if (createdCount > 0) {
      // Only reload the asset list, the dialog stays open
      emit('assets-created')
    }
  }

  function createSummary (createdCount: number, existingCount: number, failedCount: number): string {
    const assetsLabel = (count: number) => `${count} Asset${count === 1 ? '' : 's'}`
    if (existingCount === 0 && failedCount === 0) return `Successfully created ${assetsLabel(createdCount)}.`

    // The first part names the Assets, e.g. "Created 1 Asset, 1 already existed, 1 failed."
    const parts: Array<string> = []
    if (createdCount > 0) parts.push(`Created ${assetsLabel(createdCount)}`)
    if (existingCount > 0) parts.push(parts.length > 0 ? `${existingCount} already existed` : `${assetsLabel(existingCount)} already existed`)
    if (failedCount > 0) parts.push(parts.length > 0 ? `${failedCount} failed` : `Failed to create ${assetsLabel(failedCount)}`)
    return parts.join(', ') + '.'
  }
</script>
