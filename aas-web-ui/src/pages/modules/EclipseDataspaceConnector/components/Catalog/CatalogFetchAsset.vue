<template>
  <v-layout :style="{ height: fullHeight }">
    <v-main class="py-0">
      <v-container
        class="ma-0 pa-0"
        fluid
        style="overflow-y: auto"
        :style="{ height: fullHeight }"
      >

        <div class="d-flex justify-space-between align-center mt-4 mx-4 mb-2">
          <v-btn-toggle
            v-model="selectedAssetView"
            density="compact"
            mandatory
            rounded="lg"
            variant="outlined"
          >
            <v-btn value="tree">
              <v-icon start>mdi-file-tree-outline</v-icon>
              Tree
            </v-btn>

            <v-btn value="json">
              <v-icon start>mdi-code-json</v-icon>
              JSON
            </v-btn>
          </v-btn-toggle>

          <v-list-item-title class="text-body-large pr-2 d-flex align-center">
            <template v-if="isValidAAS || isValidSubmodel">
              <v-btn
                class="text-buttonText mr-2"
                color="primary"
                prepend-icon="mdi-import"
                rounded="lg"
                :text="'Import ' + (isValidAAS? 'AAS' : isValidSubmodel ? 'Submodel':'asset') + ' to'"
                variant="flat"
                @click="importAsset()"
              />

              <div>
                <v-select
                  v-model="selectedDestinationInfrastructureId"
                  density="compact"
                  hide-details
                  item-title="name"
                  item-value="id"
                  :items="destinationInfrastructureItems"
                  placeholder="Please select..."
                  variant="outlined"
                />
              </div>
            </template>

            <template v-else>
              <v-icon class="mr-2" color="primary" size="small">
                mdi-cube
              </v-icon>
              Asset
            </template>
          </v-list-item-title>
        </div>

        <!-- Asset JSON view -->
        <pre
          v-if="selectedAssetView === 'json'"
          class="json-content mt-0 mb-4 mx-4 bg-surface rounded border"
          style="min-height: 63px"
          :style="{ 'height': heightAssetJson }"
        >
          <code class="mx-5" v-html="assetJsonFormatted" />
        </pre>

        <!-- Asset Tree view -->
        <div
          v-else
          class="rounded border overflow-y-auto mt-0 mb-4 mx-4 pa-4"
          style="min-height: 63px; background-color: #f5f5f5"
          :style="{ 'height': heightAssetJson }"
        >
          <JsonTreeView :data="assetJsonParsed" />
        </div>

      </v-container>
    </v-main>
  </v-layout>
</template>

<script lang="ts" setup>
  import { jsonization } from '@aas-core-works/aas-core3.1-typescript'
  import Prism from 'prismjs'
  import { computed, ref, watch } from 'vue'
  import JsonTreeView from '@/components/UIComponents/JsonTreeView.vue'
  import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient'
  import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient'
  import { useEdcDataTransfer } from '@/pages/modules/EclipseDataspaceConnector/composables/useEdcDataTransfer'
  import { useEdcStore } from '@/pages/modules/EclipseDataspaceConnector/store/EdcStore'
  import { useInfrastructureStore } from '@/store/InfrastructureStore'
  import { useNavigationStore } from '@/store/NavigationStore'
  import { formatJSON } from '@/utils/JsonUtils'
  import { getPrismJsonLanguage } from '@/utils/prismJsonLanguage'
  import 'prismjs/themes/prism.css'

  // Props
  const props = defineProps<{
    selectedBusinessPartner: any
    selectedCatalogDataset: any
    fetchingAsset: boolean
    fullHeight: string
  }>()

  // Emits
  const emit = defineEmits<{
    'update:fetching-asset': [value: boolean]
    'update:edc-status': [value: string]
  }>()

  // Stores
  const navigationStore = useNavigationStore()
  const infrastructureStore = useInfrastructureStore()
  const edcStore = useEdcStore()

  const asset = ref<any>(null)
  const assetJson = ref<string>('')
  const assetJsonFormatted = ref<string>('')
  const assetJsonParsed = ref<unknown>({})
  const cancelled = ref(false)
  const importingInProgress = ref<boolean>(false)
  const selectedAssetView = ref<'json' | 'tree'>('json')
  const selectedDestinationInfrastructureId = ref<string | null>(infrastructureStore.getSelectedInfrastructureId)
  const heightAssetJson = ref(`calc(${props.fullHeight} - 60px - 16px)`)

  // Composables
  const { resolveEdcEndpointByCatalogDataset } = useEdcDataTransfer()
  const { postAas } = useAASRepositoryClient()
  const { postSubmodel } = useSMRepositoryClient()

  // Computed
  const isEdcV0_12_1 = computed(() => edcStore.getEdcType === 'Tractus-X EDC v0.12.1')
  const isValidAAS = computed(() => {
    const parsed = assetJsonParsed.value
    if (
      !parsed
      || typeof parsed !== 'object'
      || Object.keys(parsed).length === 0
    )
      return false
    const result = jsonization.assetAdministrationShellFromJsonable(
      parsed as jsonization.JsonValue,
    )
    return result.error === null
  })
  const isValidSubmodel = computed(() => {
    const parsed = assetJsonParsed.value
    if (
      !parsed
      || typeof parsed !== 'object'
      || Object.keys(parsed).length === 0
    )
      return false
    const result = jsonization.submodelFromJsonable(
      parsed as jsonization.JsonValue,
    )
    return result.error === null
  })
  const infrastructures = computed(() => infrastructureStore.getInfrastructures)
  const destinationInfrastructureItems = computed(() =>
    infrastructures.value.map(infra => ({
      id: infra.id,
      name: infra.name + (infra.isDefault ? ' (Default)' : ''),
    })),
  )
  const destinationInfrastructure = computed(() => {
    if (!selectedDestinationInfrastructureId.value) return null
    return (
      infrastructureStore.getInfrastructures.find(
        infra => infra.id === selectedDestinationInfrastructureId.value,
      ) || null
    )
  })

  // Watchers
  watch(
    () => props.selectedCatalogDataset,
    () => {
      assetJson.value = ''
      assetJsonFormatted.value = ''
      assetJsonParsed.value = {}
    },
    { deep: true },
  )

  async function fetchAsset (): Promise<void> {
    if (!props.selectedBusinessPartner || !props.selectedCatalogDataset)
      return

    const usePermission = isEdcV0_12_1.value
      ? {
        action: 'use',
        constraint: [
          {
            and: [
              {
                leftOperand: 'FrameworkAgreement',
                operator: 'eq',
                rightOperand: 'DataExchangeGovernance:1.0',
              },
              {
                leftOperand: 'Membership',
                operator: 'eq',
                rightOperand: 'active',
              },
              {
                leftOperand: 'UsagePurpose',
                operator: 'isAnyOf',
                rightOperand: 'cx.core.industrycore:1',
              },
            ],
          },
        ],
      }
      : []

    const { endpoint, headers } = await resolveEdcEndpointByCatalogDataset(
      props.selectedCatalogDataset,
      props.selectedBusinessPartner,
      {
        cancelled,
        setInProgress: value => emit('update:fetching-asset', value),
        setStatus: msg => emit('update:edc-status', msg),
      },
      usePermission,
    )

    if (!endpoint) return

    try {
      const response = await fetch(endpoint, { headers })
      const data = await response.json()
      asset.value = data
      assetJson.value = JSON.stringify(data)
      assetJsonParsed.value = data

      const formatted = formatJSON(assetJson.value)
      assetJsonFormatted.value
        = Prism && Prism.highlight
          ? Prism.highlight(formatted, getPrismJsonLanguage(), 'json')
          : formatted

      emit('update:edc-status', 'Asset fetched successfully')
    } catch (error) {
      console.error('Error fetching asset data:', error)
      emit('update:edc-status', `Error: Failed to fetch data - ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      emit('update:fetching-asset', false)
    }
  }

  async function importAsset (): Promise<void> {
    if (!destinationInfrastructure.value) {
      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 5000,
        color: 'error',
        btnColor: 'buttonText',
        text: 'Please select a destination infrastructure',
      })
      return
    }

    importingInProgress.value = true

    const originalInfraId = infrastructureStore.getSelectedInfrastructureId

    try {
      await infrastructureStore.dispatchSelectInfrastructure(destinationInfrastructure.value.id)
      if (isValidAAS.value) {
        const destinationAasRepoUrl = destinationInfrastructure.value.components.AASRepo.url.trim()
        if (destinationAasRepoUrl === '') {
          throw new Error('Selected destination infrastructure has no AAS Repository configured')
        }

        const aasInstanceOrError = jsonization.assetAdministrationShellFromJsonable(asset.value)
        if (aasInstanceOrError.error !== null) {
          console.error('Converting AAS Failed during Instantiation:', aasInstanceOrError.error)
        }

        const aas = aasInstanceOrError.mustValue()
        aas.id = `${aas.id}___${new Date().toISOString()}`
        aas.submodels = []

        const aasUploaded = await postAas(aas)
        if (!aasUploaded) {
          throw new Error('Failed to upload AAS to destination infrastructure')
        }
      } else if (isValidSubmodel.value) {
        const destinationSmRepoUrl = destinationInfrastructure.value.components.SubmodelRepo.url.trim()
        if (destinationSmRepoUrl === '') {
          throw new Error('Selected destination infrastructure has no Submodel Repository configured')
        }

        const smInstanceOrError = jsonization.submodelFromJsonable(asset.value)
        if (smInstanceOrError.error !== null) {
          console.error('Converting Submodel Failed during Instantiation:', smInstanceOrError.error)
        }

        const submodel = smInstanceOrError.mustValue()
        submodel.id = `${submodel.id}___${new Date().toISOString()}`

        const smUploaded = await postSubmodel(submodel)
        if (!smUploaded) {
          throw new Error('Failed to upload AAS to destination infrastructure')
        }
      }
      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 8000,
        color: 'success',
        btnColor: 'buttonText',
        text: `Successfully imported ${(isValidAAS.value ? 'AAS' : (isValidSubmodel.value ? 'Submodel' : 'asset'))} to ${destinationInfrastructure.value.name}`,
      })
    } finally {
      if (originalInfraId && infrastructureStore.getSelectedInfrastructureId !== originalInfraId) {
        await infrastructureStore.dispatchSelectInfrastructure(originalInfraId)
      }
      importingInProgress.value = false
    }
  }

  function cancel (): void {
    cancelled.value = true
  }

  defineExpose({ fetchAsset, cancel })
</script>

<style scoped>
  :deep(.token) {
    line-height: 21px;
  }

  :deep(code) {
    line-height: 21px;
  }

  .json-content {
    word-wrap: normal;
    font-size: 14px;
    line-height: 21px;
    flex-grow: 0;
    overflow: auto;
    background-color: #f5f5f5;
  }

  .json-content code {
    display: block;
  }

  :deep(.token.punctuation) {
    color: #999;
  }

  :deep(.token.property) {
    color: #905;
  }

  :deep(.token.string) {
    color: #690;
  }

  :deep(.token.number) {
    color: #07a;
  }

  :deep(.token.boolean) {
    color: #07a;
  }

  :deep(.token.null) {
    color: #999;
  }
</style>
