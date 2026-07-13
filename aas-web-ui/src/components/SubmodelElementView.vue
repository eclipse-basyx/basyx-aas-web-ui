<template>
  <v-container class="pa-0" fluid>
    <!-- Detailed View of the selected Submodel/SubmodelElement (e.g. Property, Operation, etc.) -->
    <template
      v-if="
        ((selectedAAS && Object.keys(selectedAAS).length > 0) ||
          ['SMViewer', 'SMEditor'].includes(route.name as string)) &&
          selectedNode &&
          Object.keys(selectedNode).length > 0 &&
          submodelElementData &&
          Object.keys(submodelElementData).length > 0
      "
    >
      <!-- Detailed View of the selected SubmodelElement (e.g. Property, Operation, etc.) -->
      <v-card>
        <v-list nav>
          <!-- SubmodelELement Identification -->
          <IdentificationElement :identification-object="submodelElementData" />
          <!-- Submodel Administrative Information-->
          <v-divider
            v-if="
              submodelElementData.administration &&
                (submodelElementData.administration.revision != '' ||
                  submodelElementData.administration.version != '')
            "
            class="mt-2"
          />

          <AdministrativeInformationElement
            v-if="submodelElementData.administration"
            :administrative-information-object="submodelElementData.administration"
            :administrative-information-title="'Administrative Information'"
            :small="false"
          />

          <v-divider
            v-if="submodelElementData.displayName && submodelElementData.displayName.length > 0"
            class="mt-2"
          />
          <!-- SubmodelELement DisplayName -->
          <DisplayNameElement
            v-if="submodelElementData.displayName && submodelElementData.displayName.length > 0"
            :display-name-array="submodelElementData.displayName"
            :display-name-title="'Display Name'"
            :small="false"
          />

          <v-divider
            v-if="submodelElementData.description && submodelElementData.description.length > 0"
            class="mt-2"
          />
          <!-- SubmodelELement Description -->
          <DescriptionElement
            v-if="submodelElementData.description && submodelElementData.description.length > 0"
            :description-array="submodelElementData.description"
            :description-title="'Description'"
            :small="false"
          />

          <v-divider
            v-if="
              submodelElementData.semanticId &&
                submodelElementData.semanticId.keys &&
                submodelElementData.semanticId.keys.length > 0
            "
            class="mt-2"
          />
          <!-- SubmodelELement SemanticID -->
          <SemanticID
            v-if="
              submodelElementData.semanticId &&
                submodelElementData.semanticId.keys &&
                submodelElementData.semanticId.keys.length > 0
            "
            :semantic-id-object="submodelElementData.semanticId"
            :semantic-title="'Semantic ID'"
            :small="false"
          />

          <v-divider
            v-if="
              submodelElementData.supplementalSemanticIds &&
                submodelElementData.supplementalSemanticIds.length > 0
            "
            class="mt-2"
          />
          <!-- SubmodelELement SupplementalSemanticID -->
          <SupplementalSemanticID
            v-if="
              submodelElementData.supplementalSemanticIds &&
                submodelElementData.supplementalSemanticIds.length > 0
            "
            :supplemental-semantic-ids-array="submodelElementData.supplementalSemanticIds"
            :supplemental-semantic-ids-title="'Supplemental Semantic ID'"
          />

          <v-divider
            v-if="submodelElementData.qualifiers && submodelElementData.qualifiers.length > 0"
            class="mt-2"
          />

          <QualifierElement
            v-if="submodelElementData.qualifiers && submodelElementData.qualifiers.length > 0"
            :qualifier-array="submodelElementData.qualifiers"
            :qualifier-title="'Qualifiers'"
            :small="false"
          />
        </v-list>

        <v-divider />

        <v-list class="px-4 pt-0 pb-5" nav>
          <!-- SubmodelELement Representation for different modelTypes -->
          <Submodel
            v-if="submodelElementData.modelType === 'Submodel'"
            :submodel-object="submodelElementData"
          />

          <SubmodelElementCollection
            v-else-if="submodelElementData.modelType === 'SubmodelElementCollection'"
            :submodel-element-collection-object="submodelElementData"
          />

          <SubmodelElementList
            v-else-if="submodelElementData.modelType === 'SubmodelElementList'"
            :submodel-element-list-object="submodelElementData"
          />

          <Property
            v-else-if="submodelElementData.modelType === 'Property'"
            :class="operationOwned ? 'mt-4' : ''"
            :is-editable="editorMode"
            :is-operation-variable="operationOwned"
            :property-object="submodelElementData"
            :variable-type="operationOwned && editorMode ? '' : submodelElementData.operationVariableDirection"
            @update-value="updateOperationOwnedValue"
          />

          <MultiLanguageProperty
            v-else-if="submodelElementData.modelType === 'MultiLanguageProperty'"
            :key="submodelElementData.path"
            :is-editable="editorMode && !operationOwned"
            :multi-language-property-object="submodelElementData"
          />

          <Operation
            v-else-if="submodelElementData.modelType === 'Operation'"
            :invocation-available="!operationOwned"
            :is-editable="editorMode && !operationOwned"
            :operation-object="submodelElementData"
          />

          <File
            v-else-if="submodelElementData.modelType === 'File'"
            :file-object="submodelElementData"
            :is-editable="editorMode && !operationOwned"
            :operation-owned="operationOwned"
          />

          <Blob
            v-else-if="submodelElementData.modelType === 'Blob'"
            :blob-object="submodelElementData"
            :is-editable="editorMode && !operationOwned"
          />

          <ReferenceElement
            v-else-if="submodelElementData.modelType === 'ReferenceElement'"
            :is-editable="editorMode && !operationOwned"
            :reference-element-object="submodelElementData"
          />

          <Range
            v-else-if="submodelElementData.modelType === 'Range'"
            :range-object="submodelElementData"
          />

          <Entity
            v-else-if="submodelElementData.modelType === 'Entity'"
            :entity-object="submodelElementData"
          />

          <RelationshipElement
            v-else-if="submodelElementData.modelType === 'RelationshipElement'"
            :relationship-element-object="submodelElementData"
          />

          <AnnotatedRelationshipElement
            v-else-if="submodelElementData.modelType === 'AnnotatedRelationshipElement'"
            :annotated-relationship-element-object="submodelElementData"
            :is-editable="editorMode && !operationOwned"
          />

          <SubmodelElementSummary
            v-else-if="['BasicEventElement', 'Capability'].includes(submodelElementData.modelType)"
            :element="submodelElementData"
          />

          <InvalidElement v-else :invalid-element-object="submodelElementData" />
        </v-list>
        <!-- Last Sync -->
        <v-divider />
        <LastSync :timestamp="submodelElementData.timestamp" />
      </v-card>

      <v-expansion-panels
        v-if="Array.isArray(conceptDescriptions) && conceptDescriptions.length > 0"
        v-model="expandedCdIndex"
        class="mt-3 rounded"
      >
        <v-expansion-panel
          v-for="(conceptDescription, index) in conceptDescriptions"
          :key="conceptDescription.id"
        >
          <v-expansion-panel-title
            class="bg-cardHeader px-4 py-2"
            :style="conceptDescriptionPanelTitleStyle"
          >
            <div class="d-flex align-center w-100">
              <v-icon class="mr-2 flex-shrink-0" color="primary" size="small">
                mdi-book-open-variant
              </v-icon>

              <div class="text-primary text-body-small text-truncate">
                {{ nameToDisplay(conceptDescription) }}
              </div>

              <v-spacer />

              <v-chip class="ml-3 mr-4 flex-shrink-0" color="primary" label size="x-small">
                {{ conceptDescription.modelType || 'ConceptDescription' }}
              </v-chip>
            </div>
          </v-expansion-panel-title>

          <v-divider v-if="expandedCdIndex === index" />

          <v-expansion-panel-text class="pa-0 ma-0">
            <ConceptDescription :concept-description-object="conceptDescription" :small="true" />
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </template>
  </v-container>
</template>

<script lang="ts" setup>
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import { useConceptDescriptionHandling } from '@/composables/AAS/ConceptDescriptionHandling'
  import { useOperationTreeMutation } from '@/composables/AAS/OperationTreeMutation'
  import { useReferableUtils } from '@/composables/AAS/ReferableUtils'
  import { useSMEHandling } from '@/composables/AAS/SMEHandling'
  import { useAASStore } from '@/store/AASDataStore'
  import { useInfrastructureStore } from '@/store/InfrastructureStore'
  import { useNavigationStore } from '@/store/NavigationStore'

  // Vue Router
  const route = useRoute()

  // Stores
  const navigationStore = useNavigationStore()
  const aasStore = useAASStore()
  const infrastructureStore = useInfrastructureStore()

  // Composables
  const { fetchCds } = useConceptDescriptionHandling()
  const { fetchSme } = useSMEHandling()
  const { mutateOperation } = useOperationTreeMutation()
  const { nameToDisplay } = useReferableUtils()

  // Data
  const submodelElementData = ref({} as any)
  const conceptDescriptions = ref([] as Array<any>)
  const autoSyncInterval = ref<number | undefined>(undefined) // interval to send requests to the AAS
  const expandedCdIndex = ref(0)

  // Computed Properties
  const aasRegistryURL = computed(() => infrastructureStore.getAASRegistryURL)
  const submodelRegistryURL = computed(() => infrastructureStore.getSubmodelRegistryURL)
  const selectedAAS = computed(() => aasStore.getSelectedAAS)
  const selectedNode = computed(() => aasStore.getSelectedNode)
  const autoSync = computed(() => navigationStore.getAutoSync)
  const editorMode = computed(() => ['AASEditor', 'SMEditor'].includes(route.name as string))
  const operationOwned = computed(() => submodelElementData.value?.persistence?.kind === 'operation')
  const pendingOperationValueUpdates = new Map<string, string>()

  const conceptDescriptionPanelTitleStyle = {
    minHeight: '40px',
  }

  // Watchers
  watch(
    () => aasRegistryURL.value,
    () => {
      resetLocalData()
      initialize(selectedNode.value, true)
    },
  )

  watch(
    () => submodelRegistryURL.value,
    () => {
      resetLocalData()
      initialize(selectedNode.value, true)
    },
  )

  watch(
    () => selectedAAS.value,
    async () => {
      window.clearInterval(autoSyncInterval.value) // clear old interval
      if (autoSync.value.state && selectedNode.value && Object.keys(selectedNode.value).length > 0) {
        // create new interval
        autoSyncInterval.value = window.setInterval(async () => {
          // Note: Not only fetchSme() (like in AASListDetails). Dispatching needed for ComponentVisualization
          await initialize(await fetchSelectedNode())
        }, autoSync.value.interval)
      }

      resetLocalData()
      initialize(selectedNode.value, true)
    },
    { deep: true },
  )

  watch(
    () => selectedNode.value,
    async selectedNodeValue => {
      window.clearInterval(autoSyncInterval.value) // clear old interval
      if (autoSync.value.state && selectedNodeValue && Object.keys(selectedNodeValue).length > 0) {
        // create new interval
        autoSyncInterval.value = window.setInterval(async () => {
          // Note: Not only fetchSme() (like in AASListDetails). Dispatching needed for ComponentVisualization
          await initialize(await fetchSelectedNode(selectedNodeValue))
        }, autoSync.value.interval)
      }

      if (selectedNode.value.path === submodelElementData.value.path) {
        // If updated selected node is the same, no need for update concept description
        initialize(selectedNodeValue, false)
      } else {
        resetLocalData()
        initialize(selectedNodeValue, true)
      }
    },
  )

  watch(
    () => autoSync.value,
    async autoSyncValue => {
      window.clearInterval(autoSyncInterval.value) // clear old interval
      if (autoSyncValue.state && selectedNode.value && Object.keys(selectedNode.value).length > 0) {
        initialize(await fetchSelectedNode())

        // create new interval
        autoSyncInterval.value = window.setInterval(async () => {
          // Note: Not only fetchSme() (like in AASListDetails). Dispatching needed for ComponentVisualization
          initialize(await fetchSelectedNode())
        }, autoSyncValue.interval)
      }
    },
    { deep: true },
  )

  onMounted(async () => {
    if (autoSync.value.state && selectedNode.value && Object.keys(selectedNode.value).length > 0) {
      // create new interval
      autoSyncInterval.value = window.setInterval(async () => {
        // Note: Not only fetchSme() (like in AASListDetails). Dispatching needed for ComponentVisualization
        initialize(await fetchSelectedNode())
      }, autoSync.value.interval)
    }

    initialize(selectedNode.value, true)
  })

  onBeforeUnmount(() => {
    window.clearInterval(autoSyncInterval.value) // clear old interval
  })

  /**
   * Initializes local data
   *
   * @async
   * @param {any} smeData - The submodel element (SME) data
   * @param {boolean} withConceptDescriptions - Flag to specify if local data should be updated with with ConceptDescriptions (CDs)
   */
  async function initialize (smeData: any, withConceptDescriptions = true): Promise<void> {
    if (!smeData || Object.keys(smeData).length === 0) {
      resetLocalData()
      return
    }

    submodelElementData.value = { ...smeData } // create local copy

    if (withConceptDescriptions) {
      if (
        submodelElementData.value?.conceptDescriptions
        && Array.isArray(submodelElementData.value.conceptDescriptions)
        && submodelElementData.value.conceptDescriptions.length > 0
      ) {
        conceptDescriptions.value = [...submodelElementData.value.conceptDescriptions]
        return
      }

      if (
        !conceptDescriptions.value
        || !Array.isArray(conceptDescriptions.value)
        || conceptDescriptions.value.length === 0
      ) {
        const fetchedConceptDescriptions = await fetchCds(submodelElementData.value)
        submodelElementData.value.conceptDescriptions = [...fetchedConceptDescriptions]
        conceptDescriptions.value = [...fetchedConceptDescriptions]
        return
      }

      conceptDescriptions.value = []
    }
  }

  async function fetchSelectedNode (node: any = selectedNode.value): Promise<any> {
    if (node?.persistence?.kind === 'operation') {
      return fetchSme(node.persistence.operationPath, true, node.persistence.fragment)
    }
    return fetchSme(node?.path, true)
  }

  async function updateOperationOwnedValue (value: unknown): Promise<void> {
    if (!operationOwned.value) return
    const node = submodelElementData.value
    const normalizedValue = typeof value === 'boolean' ? String(value) : value
    const serializedValue = JSON.stringify(normalizedValue)
    const selectionKey = node.selectionKey || node.path
    if (JSON.stringify(node.value) === serializedValue || pendingOperationValueUpdates.get(selectionKey) === serializedValue) {
      return
    }
    pendingOperationValueUpdates.set(selectionKey, serializedValue)
    try {
      const result = await mutateOperation(node.persistence, ({ target }) => {
        target.value = normalizedValue
      })
      if (!result.success) return
      const updatedNode = await fetchSelectedNode(node)
      aasStore.dispatchSelectedNode(updatedNode)
    } finally {
      pendingOperationValueUpdates.delete(selectionKey)
    }
  }

  /**
   * Resets local data
   */
  function resetLocalData (): void {
    submodelElementData.value = {}
    conceptDescriptions.value = []
  }
</script>

<style scoped>
    :deep(.v-expansion-panel-text__wrapper) {
        padding: 0 !important;
    }
</style>
