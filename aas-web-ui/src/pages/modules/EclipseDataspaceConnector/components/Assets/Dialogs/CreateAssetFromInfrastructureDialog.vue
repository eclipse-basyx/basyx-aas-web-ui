<template>
  <InfrastructureDialog
    v-model="createAssetDialog"
    :show-empty-state="!selectedAas"
    title="Create Asset from AAS Infrastructure"
  >
    <template #drawers>
      <InfrastructureSelectionDrawers
        v-model:aas="selectedAas"
        v-model:aas-unavailable="aasUnavailable"
        v-model:infrastructure-id="selectedInfrastructureId"
        v-model:submodel-list-failed="submodelListFailed"
        v-model:submodels="selectedSubmodels"
      />

      <EdcAssetSettingsDrawer v-model="settingsDrawer" title="Asset Settings">
        <!-- Start of the baseUrl, e.g. for a data plane reaching the repositories under other addresses than the browser -->
        <div class="d-flex flex-column ga-4">
          <div class="text-title-medium">Repository URL in baseUrl</div>

          <EdcAssetRepositoryUrlField
            v-model="aasRepositoryUrl"
            :options="repositoryUrlOptions"
            :placeholder="edcAssetRepositoryUrl(selectedAas?.endpoints?.[0]?.protocolInformation?.href ?? '')"
            subtitle="Replaces the start of the baseUrl of the AAS asset"
            title="Asset of AAS"
          />

          <EdcAssetRepositoryUrlField
            v-model="smRepositoryUrl"
            :options="repositoryUrlOptions"
            :placeholder="edcAssetRepositoryUrl(selectedSubmodels[0]?.endpoints?.[0]?.protocolInformation?.href ?? '')"
            subtitle="Replaces the start of the baseUrls of all Submodel assets"
            title="Assets of Submodels"
          />
        </div>

        <v-divider />

        <div class="d-flex flex-column ga-4">
          <div class="text-title-medium">Add OAuth2 for Assets</div>

          <EdcAssetOAuth2Fields
            v-model="aasOAuth2"
            subtitle="Used by the data address of the AAS asset"
            title="Asset of AAS"
          />

          <EdcAssetOAuth2Fields
            v-model="smOAuth2"
            subtitle="Used by the data addresses of all Submodel assets"
            title="Assets of Submodels"
          />
        </div>
      </EdcAssetSettingsDrawer>
    </template>

    <template #empty-state>
      <SelectAasEmptyState
        :aas-unavailable="aasUnavailable"
        :infrastructure-selected="!!selectedInfrastructureId"
        text="Select an AAS to register as Asset."
      />
    </template>

    <!-- Preview of the selected AAS and each selected Submodel (1/3 of the height) -->
    <JsonPreviewTabs v-model="previewTab" class="flex-1-1-0" :items="dataTabs">
      <template #append>
        <EdcAssetSettingsButton
          v-model="settingsDrawer"
          :configured="settingsConfigured"
          icon="mdi-cog"
          tooltip="Asset Settings"
        />
      </template>
    </JsonPreviewTabs>

    <v-divider />

    <!-- Preview of the Asset of the AAS or Submodel selected in the tab bar above (2/3 of the height) -->
    <JsonPreviewTabs v-model="previewTab" hide-tabs :items="edcAssetTabs" style="flex: 2 1 0" />

    <v-divider />

    <!-- The baseUrl starts with the endpoint the browser uses, the data plane may reach the repository under another address -->
    <div class="px-4 py-2 text-body-medium text-medium-emphasis">
      By default, the baseUrl of the EDC Asset starts with the address this browser uses. If EDC's data plane reaches the repository under another one,
      change it in the Asset Settings (<v-icon icon="mdi-cog" size="small" />) or edit the Asset later.
    </div>

    <template #status>
      <!-- The Asset of the AAS can be created without its Submodels -->
      <span v-if="selectedAas && submodelListFailed" class="ml-2 text-warning text-body-medium">
        Submodels could not be loaded, only AAS Asset can be created
      </span>
    </template>

    <template #actions>
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
    </template>
  </InfrastructureDialog>
</template>

<script lang="ts" setup>
  import type { JsonPreviewTab } from '@/pages/modules/EclipseDataspaceConnector/components/Shared/JsonPreviewTabs.vue'
  import type { AasUnavailableReason } from '@/pages/modules/EclipseDataspaceConnector/components/Shared/SelectAasEmptyState.vue'
  import { useSubmodelDisplay } from '@/composables/AAS/SubmodelDisplay'
  import { useCatenaXEdcClient } from '@/composables/Client/CatenaXEdcClient'
  import { DEFAULT_EDC_PROXY_ID } from '@/composables/SelectedEdcConfig'
  import EdcAssetOAuth2Fields from '@/pages/modules/EclipseDataspaceConnector/components/Assets/EdcAssetOAuth2Fields.vue'
  import EdcAssetRepositoryUrlField from '@/pages/modules/EclipseDataspaceConnector/components/Assets/EdcAssetRepositoryUrlField.vue'
  import EdcAssetSettingsButton from '@/pages/modules/EclipseDataspaceConnector/components/Assets/EdcAssetSettingsButton.vue'
  import EdcAssetSettingsDrawer from '@/pages/modules/EclipseDataspaceConnector/components/Assets/EdcAssetSettingsDrawer.vue'
  import InfrastructureDialog from '@/pages/modules/EclipseDataspaceConnector/components/Shared/InfrastructureDialog.vue'
  import InfrastructureSelectionDrawers from '@/pages/modules/EclipseDataspaceConnector/components/Shared/InfrastructureSelectionDrawers.vue'
  import JsonPreviewTabs from '@/pages/modules/EclipseDataspaceConnector/components/Shared/JsonPreviewTabs.vue'
  import SelectAasEmptyState from '@/pages/modules/EclipseDataspaceConnector/components/Shared/SelectAasEmptyState.vue'
  import { useEdcAssetFromAas } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcAssetFromAas'
  import {
    createEmptyEdcAssetOAuth2,
    type EdcAssetOAuth2,
    hasEdcAssetOAuth2,
  } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcAssetOAuth2'
  import {
    edcAssetRepositoryUrl,
    edcAssetRepositoryUrlOptions,
    normalizeEdcAssetRepositoryUrl,
  } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcAssetRepositoryUrl'
  import { useEdcDialogRoute } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcDialogRoute'
  import {
    edcRequestFailureText,
    useEdcRequestFailureMessage,
  } from '@/pages/modules/EclipseDataspaceConnector/composables/EdcRequestFailure'
  import { useInfrastructureStore } from '@/store/InfrastructureStore'
  import { useNavigationStore } from '@/store/NavigationStore'

  const props = withDefaults(defineProps<{
    proxyId?: string
  }>(), {
    proxyId: DEFAULT_EDC_PROXY_ID,
  })

  const emit = defineEmits<{
    (event: 'assets-created', assetId?: string): void
  }>()

  const createAssetDialog = defineModel<boolean>({ required: true })

  // Stores
  const infrastructureStore = useInfrastructureStore()
  const navigationStore = useNavigationStore()

  // Composables
  const { smTitleToDisplay } = useSubmodelDisplay()
  const { createAasEdcAsset, createSmEdcAsset } = useEdcAssetFromAas()
  const { createAsset: createAssetInEdc } = useCatenaXEdcClient()
  const { showFailureMessage } = useEdcRequestFailureMessage()
  const { dialogState } = useEdcDialogRoute()

  // Data
  const selectedInfrastructureId = dialogState('infrastructure') // In the URL to return to it after a login, removed on close
  const selectedAas = ref<any>(null)
  const aasUnavailable = ref<AasUnavailableReason | null>(null) // Set by the AAS List of the selected infrastructure
  const submodelListFailed = ref(false) // Set by the Submodel List of the selected AAS
  const selectedSubmodels = ref<Array<any>>([])
  const previewTab = ref<string>('aas') // Tab of both previews: 'aas' or the ID of a selected Submodel
  const settingsDrawer = ref(false)
  const aasRepositoryUrl = ref('') // Start of the baseUrl of the AAS Asset, empty for the one of the AAS endpoint
  const smRepositoryUrl = ref('') // Start of the baseUrls of the Submodel Assets, empty for the ones of the Submodel endpoints
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
      json: createAasEdcAsset(selectedAas.value, aasOAuth2.value, aasRepositoryUrl.value),
    },
    ...selectedSubmodels.value.map(submodel => ({
      value: submodel.id,
      title: smTitleToDisplay(submodel),
      previewTitle: 'Asset of Submodel',
      previewIcon: 'custom:edcIcon',
      json: createSmEdcAsset(selectedAas.value, submodel, smOAuth2.value, smRepositoryUrl.value),
    })),
  ])

  const repositoryUrlOptions = computed(() => edcAssetRepositoryUrlOptions(infrastructureStore.getInfrastructures))
  const settingsConfigured = computed(() =>
    [aasRepositoryUrl.value, smRepositoryUrl.value].some(url => normalizeEdcAssetRepositoryUrl(url) !== '')
    || hasEdcAssetOAuth2(aasOAuth2.value)
    || hasEdcAssetOAuth2(smOAuth2.value),
  )

  // Watchers
  watch(
    () => createAssetDialog.value,
    value => {
      if (!value) {
        settingsDrawer.value = false
      }
    },
  )

  watch(
    () => selectedInfrastructureId.value,
    () => {
      // Repository URLs and OAuth2 values belong to the repositories of an infrastructure
      aasRepositoryUrl.value = ''
      smRepositoryUrl.value = ''
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

  // Methods
  async function createEdcAssets (): Promise<void> {
    if (!selectedAas.value) return

    const edcAssets = [
      { name: 'AAS', asset: createAasEdcAsset(selectedAas.value, aasOAuth2.value, aasRepositoryUrl.value) },
      ...selectedSubmodels.value.map(submodel => ({
        name: `Submodel ${smTitleToDisplay(submodel)}`,
        asset: createSmEdcAsset(selectedAas.value, submodel, smOAuth2.value, smRepositoryUrl.value),
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
    return `${parts.join(', ')}.`
  }
</script>
