<template>
  <v-container class="pa-0" fluid>
    <VisualizationHeader default-title="Handover Documentation" :submodel-element-data="submodelElementData" />
    <!-- Loading -->
    <v-card v-if="isLoading" class="mb-4">
      <v-skeleton-loader :height="144" type="list-item-avatar, divider, list-item-avatar" />
    </v-card>
    <template v-else>
      <v-expansion-panels v-if="documents.length > 0" v-model="panel">
        <v-expansion-panel v-for="(document, i) in documents" :key="document.idShort ?? i">
          <v-expansion-panel-title>
            <v-list-item class="pa-0">
              <template #prepend>
                <v-icon size="small">mdi-file-outline</v-icon>
              </template>

              <v-list-item-title>
                {{ getDocumentTitle(document, i) }}
                <DescriptionTooltip :description-array="getDescriptionArray(document)" />
              </v-list-item-title>
            </v-list-item>
          </v-expansion-panel-title>

          <v-divider v-if="panel === i" />

          <v-expansion-panel-text class="pt-4">
            <!-- DocumentIds -->
            <DocumentIdsTable :document-ids="document.documentIds" />

            <!-- Document Versions -->
            <template v-if="(document.documentVersionInfo ?? []).length > 0">
              <div class="text-caption text-subtitleText">
                <!-- Tabs for document versions -->
                <v-tabs
                  class="mt-2"
                  color="primary"
                  density="comfortable"
                  :model-value="getVersionTab(document)"
                  @update:model-value="(val) => onVersionTabUpdate(document, val)"
                >
                  <v-tab
                    v-for="(versionSmc, v) in document.documentVersionInfo ?? []"
                    :key="versionSmc.id ?? versionSmc.idShort ?? `version-${v}`"
                    :value="v"
                  >
                    {{ nameToDisplay(versionSmc) }}
                  </v-tab>
                </v-tabs>
                <v-divider class="mt-2" />
                <v-window class="mt-3" :model-value="getVersionTab(document)">
                  <v-window-item
                    v-for="(versionSmc, v) in document.documentVersionInfo ?? []"
                    :key="versionSmc.id ?? versionSmc.idShort ?? `version-${v}`"
                    :value="v"
                  >
                    <div class="pt-4">
                      <!-- Table for Version Metadata -->
                      <VersionMetadataTable :version-smc="versionSmc" />

                      <!-- Tabs for File and Digital Files -->
                      <VersionAttachments :version-smc="versionSmc" />
                    </div>
                  </v-window-item>
                </v-window>
              </div>
            </template>

            <v-alert
              v-else
              class="mt-3"
              density="compact"
              text="No Document Versions available"
              type="warning"
              variant="outlined"
            />
            <!-- <div class="mt-6 text-subtitle-2">Document Classifications (TODO)</div> -->
            <!-- <div class="mt-3 text-subtitle-2">Documented Entities (TODO)</div> -->
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <v-alert
        v-else
        class="mt-3"
        density="compact"
        text="No Documents available"
        type="info"
        variant="outlined"
      />
    </template>
  </v-container>
</template>

<script lang="ts" setup>
  import type { DocumentLike, SubmodelElementLike } from './types'
  import { onMounted, ref } from 'vue'
  import { useReferableUtils } from '@/composables/AAS/ReferableUtils'
  import { useSMHandling } from '@/composables/AAS/SMHandling'
  import { useSME } from '@/composables/AAS/SubmodelElements/SubmodelElement'
  import { getSubmodelElementBySemanticId, getSubmodelElementsBySemanticId } from '@/utils/AAS/SemanticIdUtils'
  import { getDescriptionArray, getDisplayTitleOrFallback } from './utils/submodelElementUtils'

  defineOptions({
    name: 'HandoverDocumentation',
    semanticId: '0173-1#01-AHF578#003',
  })
  // Composables
  const { setData } = useSMHandling()
  const { nameToDisplay } = useReferableUtils()
  const { hasValue } = useSME()

  // Props
  const props = defineProps<{
    submodelElementData?: SubmodelElementLike
  }>()

  // Data
  const isLoading = ref(false)
  const handoverDocumentationData = ref<SubmodelElementLike>({})
  const panel = ref(null as number | null)
  const documents = ref<DocumentLike[]>([])
  const documentsSml = ref<SubmodelElementLike | null>(null)
  const versionTab = ref<Record<string, number>>({})

  onMounted(() => {
    initializeVisualization()
  })

  async function initializeVisualization (): Promise<void> {
    isLoading.value = true

    if (!props.submodelElementData || Object.keys(props.submodelElementData).length === 0) {
      handoverDocumentationData.value = {}
      isLoading.value = false
      return
    }

    handoverDocumentationData.value = await setData(
      { ...props.submodelElementData },
      props.submodelElementData.path ?? '',
    )

    //  Get Documents SML
    documentsSml.value = getSubmodelElementBySemanticId('0173-1#02-ABI500#003', handoverDocumentationData.value)
    if (
      !documentsSml.value?.value
      || !Array.isArray(documentsSml.value.value)
      || documentsSml.value.value.length === 0
    ) {
      documents.value = []
      isLoading.value = false
      return
    }
    //  Get Document SMC entries (many)
    const documentSmcs = getSubmodelElementsBySemanticId(
      '0173-1#02-ABI500#003/0173-1#01-AHF579#003',
      documentsSml.value,
    ) as SubmodelElementLike[]
    documents.value = documentSmcs

    //  For each Document → get Document data
    documents.value.forEach((doc: DocumentLike) => {
      // function for Document Versions
      extractDocumentVersionInfo(doc)

      // function for DocumentIds
      // Get DocumentIds SML (container, one per document)
      const documentIdsSml = getSubmodelElementBySemanticId('0173-1#02-ABI501#003', doc)
      if (!documentIdsSml || !documentIdsSml.value) {
        doc.documentIds = []
        return
      }

      // Get DocumentId SMC entries (many)
      const documentIdSmcs = getSubmodelElementsBySemanticId(
        '0173-1#02-ABI501#003/0173-1#01-AHF580#003',
        documentIdsSml,
      ) as SubmodelElementLike[]

      doc.documentIds = documentIdSmcs
    })
    isLoading.value = false
  }

  function extractDocumentVersionInfo (doc: DocumentLike): void {
    // Get Document Version Info SML (container, one per document)
    const documentVersionInfoSml = getSubmodelElementBySemanticId('0173-1#02-ABI503#003', doc)

    if (
      !documentVersionInfoSml
      || !Array.isArray(documentVersionInfoSml.value)
      || documentVersionInfoSml.value.length === 0
    ) {
      doc.documentVersionInfo = []
      return
    }
    // Get Document Version Info SMC entries (many)
    const documentVersionInfoSmcs = getSubmodelElementsBySemanticId(
      '0173-1#02-ABI503#003/0173-1#01-AHF582#003',
      documentVersionInfoSml,
    ).filter((sme: unknown) => hasValue(sme)) as SubmodelElementLike[]

    doc.documentVersionInfo = documentVersionInfoSmcs
  }
  function getVersionTab (document: DocumentLike): number {
    const key = document?.id ?? document?.idShort ?? 'doc'
    return versionTab.value[key] ?? 0
  }
  function setVersionTab (document: DocumentLike, index: number): void {
    const key = document?.id ?? document?.idShort ?? 'doc'
    versionTab.value[key] = index
  }
  function onVersionTabUpdate (document: DocumentLike, value: unknown): void {
    setVersionTab(document, typeof value === 'number' ? value : 0)
  }

  function getDocumentTitle (document: DocumentLike, index: number): string {
    const documentName = String(nameToDisplay(document) ?? '')
    return getDisplayTitleOrFallback(documentName, 'Document', index)
  }
</script>
