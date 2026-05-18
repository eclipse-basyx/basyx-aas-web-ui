<template>
  <v-dialog v-model="dialog" :width="800">
    <v-sheet border :loading="loading" rounded="lg">
      <v-card-title class="bg-cardHeader">Create AAS from KBL/VEC</v-card-title>
      <v-divider />

      <v-card-text class="overflow-y-auto" style="max-height: calc(100vh - 296px)">
        <v-file-upload
          v-model="selectedFile"
          :accept="['.kbl', '.vec']"
          class="my-1"
          clearable
          density="default"
          :multiple="false"
          title="Drag and drop KBL/VEC file here"
        />

        <v-file-upload
          v-model="productImageFile"
          :accept="['image/*']"
          class="my-1"
          clearable
          density="default"
          label="Optional: Product image (thumbnail)"
          :multiple="false"
          title="Drag and drop product image here (optional)"
        />

        <template v-if="isStructuredXmlFile && hasFile">
          <v-label class="mt-5 d-block">Required AAS Fields</v-label>

          <div class="text-caption text-medium-emphasis mt-1">
            Values are auto-filled from KBL/VEC when possible and can be edited manually.
          </div>

          <v-alert v-if="missingRequiredFieldLabels.length > 0" class="mt-2" density="compact" type="warning">
            Please provide: {{ missingRequiredFieldLabels.join(', ') }}
          </v-alert>

          <v-row class="mt-1" dense>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="requiredFieldValues.shortId"
                density="compact"
                label="ShortID"
                required
                :rules="[requiredFieldRule]"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="requiredFieldValues.aasId"
                density="compact"
                label="AAS Id"
                required
                :rules="[requiredFieldRule]"
              >
                <template #append-inner>
                  <v-btn
                    border
                    class="text-none"
                    color="primary"
                    size="small"
                    slim
                    text="Generate"
                    variant="text"
                    @click.stop="generateAasId"
                  />
                </template>
              </v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="requiredFieldValues.assetId"
                density="compact"
                label="Asset ID"
                required
                :rules="[requiredFieldRule]"
              >
                <template #append-inner>
                  <v-btn
                    border
                    class="text-none"
                    color="primary"
                    size="small"
                    slim
                    text="Generate"
                    variant="text"
                    @click.stop="generateAssetId"
                  />
                </template>
              </v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="requiredFieldValues.aasName"
                density="compact"
                label="AAS Name"
                required
                :rules="[requiredFieldRule]"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="requiredFieldValues.aasDescription"
                density="compact"
                label="AAS Description"
                required
                :rules="[requiredFieldRule]"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-combobox
                v-model="requiredFieldValues.assetKind"
                density="compact"
                :items="assetKindOptions"
                label="Asset Kind"
                required
                :rules="[requiredFieldRule]"
              />
            </v-col>
          </v-row>

          <v-alert v-if="extractionError !== ''" class="mt-3" density="compact" type="error">
            {{ extractionError }}
          </v-alert>

          <template v-else>
            <v-label class="mt-5 d-block">KBL/VEC Data Points</v-label>

            <div class="d-flex align-center mt-2">
              <div class="text-caption text-medium-emphasis">
                {{ selectedDataPointCount }} / {{ selectableDataPointCount }} selected
              </div>

              <v-spacer />

              <v-btn
                :disabled="extractedDataPoints.length === 0"
                size="small"
                variant="text"
                @click="selectAllDataPoints"
              >
                Select all
              </v-btn>

              <v-btn
                :disabled="extractedDataPoints.length === 0"
                size="small"
                variant="text"
                @click="clearDataPointSelection"
              >
                Clear
              </v-btn>
            </div>

            <v-text-field
              v-model="dataPointSearch"
              class="mt-2"
              clearable
              density="compact"
              hide-details
              label="Search data points"
            />

            <div v-if="extractionInProgress" class="text-caption text-medium-emphasis mt-2">
              {{ extractionProgressText }}
            </div>

            <v-progress-linear
              v-if="extractionInProgress"
              class="mt-1"
              height="6"
              indeterminate
              rounded
            />

            <v-sheet border class="mt-2" rounded="lg">
              <v-list class="py-0" density="compact">
                <v-virtual-scroll height="320" :item-height="72" :items="visibleDataPointRows">
                  <template #default="{ item }">
                    <v-list-item :key="item.key" class="px-2" @click="handleRowClick(item)">
                      <template #prepend>
                        <v-btn
                          v-if="item.hasChildren"
                          icon
                          size="x-small"
                          variant="text"
                          @click.stop="toggleRowExpanded(item.key)"
                        >
                          <v-icon :icon="expandedRowKeys.has(item.key) ? 'mdi-chevron-down' : 'mdi-chevron-right'" />
                        </v-btn>

                        <v-icon class="mr-1" :icon="item.icon" />

                        <v-checkbox-btn
                          v-if="item.selectable || item.hasChildren"
                          :indeterminate="isRowPartiallySelected(selectedDataPointKeys, getSelectableKeysForRow(item))"
                          :model-value="isRowFullySelected(selectedDataPointKeys, getSelectableKeysForRow(item))"
                          @click.stop="selectedDataPointKeys = toggleRowSelection(selectedDataPointKeys, getSelectableKeysForRow(item))"
                        />
                      </template>

                      <v-list-item-title
                        class="text-body-2"
                        :style="{ paddingLeft: `${item.depth * 16}px` }"
                      >
                        {{ item.displayLabel }}
                      </v-list-item-title>

                      <v-list-item-subtitle class="text-caption">
                        {{ item.kindLabel }}
                        <span v-if="item.value !== ''"> | {{ item.value }}</span>
                        <span v-if="item.leafCount > 0"> | export points: {{ item.leafCount }}</span>
                      </v-list-item-subtitle>
                    </v-list-item>
                  </template>
                </v-virtual-scroll>

                <v-list-item v-if="visibleDataPointRows.length === 0" class="px-2">
                  <v-list-item-title class="text-caption text-medium-emphasis">No matching data points</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-sheet>
          </template>
        </template>

        <v-checkbox v-model="ignoreDuplicates" class="mt-3" hide-details label="Ignore Duplicates" />

        <v-checkbox
          v-if="isStructuredXmlFile && hasFile"
          v-model="debugUploadPayload"
          class="mt-2"
          hide-details
          label="Debug: log selected KBL/VEC payload in browser console"
        />

        <v-alert
          v-if="uploadDebugInfo.trim() !== ''"
          border="start"
          class="mt-3"
          density="compact"
          type="info"
          variant="tonal"
        >
          {{ uploadDebugInfo }}
        </v-alert>

        <v-progress-linear
          v-if="loading"
          class="mt-4"
          color="primary"
          height="12"
          indeterminate
          rounded
        />
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />
        <v-btn :disabled="loading" rounded="lg" text="Cancel" @click="dialog = false" />

        <v-btn
          class="text-buttonText"
          color="primary"
          :disabled="isCreateDisabled"
          :loading="loading"
          rounded="lg"
          text="Create AAS"
          variant="flat"
          @click="createFromFile"
        />
      </v-card-actions>
    </v-sheet>
  </v-dialog>
</template>

<script lang="ts" setup>
  import { types as aasTypes, jsonization } from '@aas-core-works/aas-core3.1-typescript'
  import { computed, onBeforeUnmount, ref, watch, watchEffect } from 'vue'
  import { useSMEFile } from '@/composables/AAS/SubmodelElements/File'
  import { useAASRepositoryClient } from '@/composables/Client/AASRepositoryClient'
  import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient'
  import { useIDUtils } from '@/composables/IDUtils'
  import { useNavigationStore } from '@/store/NavigationStore'
  import {
    appendVisibleTreeRows,
    buildDataPointTree,
    collectExportPointsFromSelectedNodes,
    collectSelectableNodeKeys,
    countSelectableNodes,
    type DataPointTreeNode,
    type ExtractedDataPoint,
    getSelectableKeysForRow,
  } from '@/utils/KblVecUtils/KblVecDataPointTreeUtils'
  import {
    createEmptyRequiredFieldPaths,
    createEmptyRequiredFieldValues,
    inferRequiredFieldValues,
    requiredFieldDefinitions,
    type RequiredFieldPaths,
    type RequiredFieldValues,
  } from '@/utils/KblVecUtils/KblVecRequiredFieldUtils'
  import {
    isRowFullySelected,
    isRowPartiallySelected,
    toggleRowSelection,
    toggleSelection,
  } from '@/utils/KblVecUtils/KblVecSelectionStateUtils'
  import { buildSubmodelsFromSelection } from '@/utils/KblVecUtils/KblVecSubmodelGenerationUtils'
  import {
    buildBackendSpecificHint,
    splitIdAndSuffix,
    stringifyUnknown,
  } from '@/utils/KblVecUtils/KblVecUploadUtils'
  import {
    buildAttachmentSmePath,
    normalizeAssetKind,
  } from '@/utils/KblVecUtils/KblVecXmlConversionUtils'
  import { uploadHandler } from '@/utils/XmlValidator'

  type StructuredConversionResult = {
    success: boolean
    dataPointCount: number
    submodelCount: number
    errorDetails?: string
  }

  const EXTRACTION_CHUNK_SIZE_FOR_VEC = 250
  const EXTRACTION_CHUNK_SIZE_FOR_KBL = 600
  const MAX_ELEMENT_SCAN_FOR_ALIAS_FALLBACK = 25_000

  const props = defineProps<{
    modelValue: boolean
  }>()

  const emit = defineEmits<{
    (event: 'update:modelValue', value: boolean): void
  }>()

  const navigationStore = useNavigationStore()
  const { uploadAas, postAas, putAas, putThumbnail, aasIsAvailableById } = useAASRepositoryClient()
  const {
    postSubmodel,
    postSubmodelElement,
    putSubmodelElement,
    fetchSme,
    smIsAvailableById,
    getSmEndpointById,
    putAttachmentFile,
    fetchAttachmentFile,
  } = useSMRepositoryClient()
  const { determineContentType } = useSMEFile()
  const { generateIri } = useIDUtils()

  const dialog = ref(false)
  const loading = ref(false)
  const ignoreDuplicates = ref(true)
  const selectedFile = ref<any>(null)
  const productImageFile = ref<any>(null)
  const extractionError = ref('')
  const extractionInProgress = ref(false)
  const extractionProcessedNodes = ref(0)
  const dataPointSearch = ref('')
  const debouncedDataPointSearch = ref('')
  const extractedDataPoints = ref<ExtractedDataPoint[]>([])
  const selectedDataPointKeys = ref<Set<string>>(new Set())
  const dataPointTree = ref<DataPointTreeNode[]>([])
  const expandedRowKeys = ref<Set<string>>(new Set())
  const requiredFieldValues = ref<RequiredFieldValues>(createEmptyRequiredFieldValues())
  const requiredFieldPaths = ref<RequiredFieldPaths>(createEmptyRequiredFieldPaths())
  const debugUploadPayload = ref(false)
  const uploadDebugInfo = ref('')
  const extractionRunId = ref(0)
  let dataPointSearchDebounceHandle: ReturnType<typeof setTimeout> | undefined
  const assetKindOptions = ['Instance', 'Type']
  const requiredFieldRule = (value: string) => value.trim() !== '' || 'Required'

  const hasFile = computed(() => getSelectedFile() !== null)
  const isKblFile = computed(() => {
    const file = getSelectedFile()
    return !!file && file.name.toLowerCase().endsWith('.kbl')
  })
  const isVecFile = computed(() => {
    const file = getSelectedFile()
    return !!file && file.name.toLowerCase().endsWith('.vec')
  })
  const isStructuredXmlFile = computed(() => isKblFile.value || isVecFile.value)
  const selectedDataPointCount = computed(() => selectedDataPointKeys.value.size)
  const selectableDataPointCount = computed(() => countSelectableNodes(dataPointTree.value))
  const extractionProgressText = computed(() => {
    return `Scanning XML nodes: ${extractionProcessedNodes.value.toLocaleString()}`
  })
  const visibleDataPointRows = computed<DataPointTreeNode[]>(() => {
    const query = debouncedDataPointSearch.value.trim().toLowerCase()
    const rows: DataPointTreeNode[] = []

    for (const node of dataPointTree.value) {
      appendVisibleTreeRows(rows, node, 0, query, expandedRowKeys.value)
    }

    return rows
  })
  const selectedDataPoints = computed(() => {
    const selectedPathValues = new Map<string, { path: string, value: string }>()

    for (const node of dataPointTree.value) {
      collectExportPointsFromSelectedNodes(node, selectedDataPointKeys.value, selectedPathValues)
    }

    // Keep payload backend-compatible: only send data points with real KBL paths.
    for (const definition of requiredFieldDefinitions) {
      const path = requiredFieldPaths.value[definition.key]?.trim() ?? ''
      if (path === '') continue

      const value = requiredFieldValues.value[definition.key].trim()
      if (value === '') continue

      selectedPathValues.set(path, { path, value })
    }

    return Array.from(selectedPathValues.values())
  })
  const missingRequiredFieldLabels = computed(() => {
    return requiredFieldDefinitions
      .filter(definition => requiredFieldValues.value[definition.key].trim() === '')
      .map(definition => definition.label)
  })
  const isCreateDisabled = computed(() => {
    if (loading.value || !hasFile.value) return true
    if (extractionInProgress.value) return true
    if (!isStructuredXmlFile.value) return false
    if (extractionError.value.trim() !== '') return true
    if (missingRequiredFieldLabels.value.length > 0) return true
    return false
  })

  watch(
    () => props.modelValue,
    value => {
      dialog.value = value
    },
  )

  watch(
    () => dialog.value,
    value => {
      emit('update:modelValue', value)
    },
  )

  watchEffect(() => {
    if (!dialog.value) resetState()
  })

  watch(
    () => selectedFile.value,
    async () => {
      await extractDataPointsFromCurrentFile()
    },
  )

  watch(
    () => dataPointSearch.value,
    value => {
      if (dataPointSearchDebounceHandle) {
        clearTimeout(dataPointSearchDebounceHandle)
      }

      dataPointSearchDebounceHandle = setTimeout(() => {
        debouncedDataPointSearch.value = value
      }, 180)
    },
  )

  onBeforeUnmount(() => {
    if (dataPointSearchDebounceHandle) {
      clearTimeout(dataPointSearchDebounceHandle)
    }
  })

  function getSelectedFile (): File | null {
    if (!selectedFile.value) return null
    if (Array.isArray(selectedFile.value)) return selectedFile.value.length > 0 ? selectedFile.value[0] : null
    return selectedFile.value as File
  }

  function getSelectedProductImage (): File | null {
    if (!productImageFile.value) return null
    if (Array.isArray(productImageFile.value)) {
      return productImageFile.value.length > 0 ? productImageFile.value[0] : null
    }
    return productImageFile.value as File
  }

  function generateAasId (): void {
    requiredFieldValues.value.aasId = generateIri('AssetAdministrationShell')
  }

  function generateAssetId (): void {
    requiredFieldValues.value.assetId = generateIri('Asset')
  }

  async function createFromFile (): Promise<void> {
    const file = getSelectedFile()
    if (!file) return

    loading.value = true
    uploadDebugInfo.value = ''
    try {
      const validationError = await uploadHandler(file)
      if (validationError && validationError.trim() !== '') {
        navigationStore.dispatchSnackbar({
          status: true,
          timeout: 6000,
          color: 'error',
          btnColor: 'buttonText',
          baseError: 'KBL/VEC validation failed.',
          extendedError: validationError,
        })
        return
      }

      if (isStructuredXmlFile.value && debugUploadPayload.value) {
        console.info('[UploadAASKblVec] selectedDataPoints payload', {
          fileName: file.name,
          ignoreDuplicates: ignoreDuplicates.value,
          selectedDataPoints: selectedDataPoints.value,
        })
      }

      if (isStructuredXmlFile.value) {
        const conversionResult = await convertStructuredXmlToAasAndUpload(file)

        if (conversionResult.success) {
          navigationStore.dispatchTriggerAASListReload()
          navigationStore.dispatchSnackbar({
            status: true,
            timeout: 7000,
            color: 'success',
            btnColor: 'buttonText',
            text: `AAS created in 2 steps: model + image, then ${conversionResult.submodelCount} generated submodel(s) with ${conversionResult.dataPointCount} value(s).`,
          })
          dialog.value = false
          return
        }

        const errorDetails
          = conversionResult.errorDetails || 'Client-side conversion to AAS failed before upload.'
        uploadDebugInfo.value = errorDetails
        navigationStore.dispatchSnackbar({
          status: true,
          timeout: 12_000,
          color: 'error',
          btnColor: 'buttonText',
          baseError: 'Failed to convert and upload KBL/VEC as AAS.',
          extendedError: errorDetails,
        })
        return
      }

      const uploadFile = createUploadCompatibleFile(file)

      const response = await uploadAas(uploadFile, ignoreDuplicates.value)
      if (response?.success) {
        await uploadProductImageIfProvided()
        navigationStore.dispatchTriggerAASListReload()

        navigationStore.dispatchSnackbar({
          status: true,
          timeout: 6000,
          color: 'success',
          btnColor: 'buttonText',
          text: 'AAS creation completed successfully.',
        })
        dialog.value = false
      } else {
        const errorDetails = buildUploadFailureDetails(response, undefined, file.name)
        uploadDebugInfo.value = errorDetails
        navigationStore.dispatchSnackbar({
          status: true,
          timeout: 12_000,
          color: 'error',
          btnColor: 'buttonText',
          baseError: 'Failed to create AAS from KBL/VEC file.',
          extendedError: errorDetails,
        })
      }
    } catch (error) {
      const errorDetails = buildUploadFailureDetails(undefined, error, file.name)
      uploadDebugInfo.value = errorDetails
      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 12_000,
        color: 'error',
        btnColor: 'buttonText',
        baseError: 'Failed to create AAS from KBL/VEC file.',
        extendedError: errorDetails,
      })
    } finally {
      loading.value = false
    }
  }

  function createUploadCompatibleFile (file: File): File {
    if (!isStructuredXmlFile.value) return file

    const xmlName = file.name.replace(/\.(kbl|vec)$/i, '.xml')
    if (xmlName === file.name) return file

    return new File([file], xmlName, {
      type: file.type || 'text/xml',
      lastModified: file.lastModified,
    })
  }

  async function convertStructuredXmlToAasAndUpload (file: File): Promise<StructuredConversionResult> {
    try {
      const values = requiredFieldValues.value
      const aasId = values.aasId.trim()
      const assetId = values.assetId.trim()
      const shortId = values.shortId.trim()
      const aasName = values.aasName.trim()
      const aasDescription = values.aasDescription.trim()

      if (aasId === '' || assetId === '' || shortId === '') {
        return {
          success: false,
          dataPointCount: 0,
          submodelCount: 0,
          errorDetails: 'Required fields are missing for conversion (AAS Id, Asset Id, ShortID).',
        }
      }

      const assetInformation = new aasTypes.AssetInformation(normalizeAssetKind(values.assetKind), assetId)
      const shell = new aasTypes.AssetAdministrationShell(aasId, assetInformation)
      shell.idShort = shortId

      if (aasName !== '') {
        shell.displayName = [new aasTypes.LangStringNameType('en', aasName)]
      }

      if (aasDescription !== '') {
        shell.description = [new aasTypes.LangStringTextType('en', aasDescription)]
      }

      // Step 1: Create the AAS shell with user-provided fields.
      const aasPersisted = await persistAasFromConversion(shell)
      if (!aasPersisted) {
        return {
          success: false,
          dataPointCount: 0,
          submodelCount: 0,
          errorDetails: `Failed to persist converted AAS '${aasId}'.`,
        }
      }

      // Step 1.1: Upload image directly after shell creation.
      const uploadedThumbnail = await uploadProductImageIfProvided()
      if (uploadedThumbnail) {
        shell.assetInformation.defaultThumbnail = uploadedThumbnail
      }

      // Step 2: Generate Submodels from the selected tree nodes grouped by top-level tag.
      const generated = buildSubmodelsFromSelection(
        aasId,
        file,
        dataPointTree.value,
        selectedDataPointKeys.value,
        isVecFile.value,
        determineContentType,
      )

      for (const submodel of generated.submodels) {
        const submodelPersisted = await persistSubmodelFromConversion(submodel)
        if (!submodelPersisted) {
          return {
            success: false,
            dataPointCount: generated.dataPointCount,
            submodelCount: generated.submodels.length,
            errorDetails: `Failed to persist converted Submodel '${submodel.id}'.`,
          }
        }
      }

      const handoverSubmodel = generated.submodels.find(submodel => submodel.idShort === 'HandoverDocumentation')
      if (handoverSubmodel) {
        const fileElementCreated = await createOriginalKblVecFileElement(handoverSubmodel.id, file)
        if (!fileElementCreated) {
          return {
            success: false,
            dataPointCount: generated.dataPointCount,
            submodelCount: generated.submodels.length,
            errorDetails: `Submodel '${handoverSubmodel.id}' was created, but creating File element 'OriginalKblVecDocument' failed.`,
          }
        }

        const uploadedSourceFile = await uploadGeneratedSourceFileAttachment(handoverSubmodel.id, file)
        if (!uploadedSourceFile) {
          return {
            success: false,
            dataPointCount: generated.dataPointCount,
            submodelCount: generated.submodels.length,
            errorDetails: `Submodel '${handoverSubmodel.id}' was created, but uploading file attachment for OriginalKblVecDocument failed.`,
          }
        }
      }

      shell.submodels = generated.submodels.map(
        submodel =>
          new aasTypes.Reference(aasTypes.ReferenceTypes.ModelReference, [
            new aasTypes.Key(aasTypes.KeyTypes.Submodel, submodel.id),
          ]),
      )

      if (generated.submodels.length > 0 || uploadedThumbnail !== null) {
        const shellUpdated = await putAas(shell)
        if (!shellUpdated) {
          return {
            success: false,
            dataPointCount: generated.dataPointCount,
            submodelCount: generated.submodels.length,
            errorDetails: `AAS '${aasId}' was created, but linking generated Submodels failed.`,
          }
        }
      }

      const creationConfirmed = await aasIsAvailableById(aasId)
      if (!creationConfirmed) {
        return {
          success: false,
          dataPointCount: generated.dataPointCount,
          submodelCount: generated.submodels.length,
          errorDetails: `Converted AAS '${aasId}' was posted but is not available in repository.`,
        }
      }

      return {
        success: true,
        dataPointCount: generated.dataPointCount,
        submodelCount: generated.submodels.length,
      }
    } catch (error) {
      return {
        success: false,
        dataPointCount: 0,
        submodelCount: 0,
        errorDetails: `Client-side conversion failed: ${stringifyUnknown(error)}`,
      }
    }
  }

  async function createOriginalKblVecFileElement (submodelId: string, sourceFile: File): Promise<boolean> {
    const fileElement = new aasTypes.File()
    fileElement.idShort = 'OriginalKblVecDocument'
    fileElement.contentType = determineContentType(sourceFile, 'application/xml')
    fileElement.value = ''

    return await postSubmodelElement(fileElement, submodelId)
  }

  async function uploadGeneratedSourceFileAttachment (submodelId: string, sourceFile: File): Promise<boolean> {
    const smEndpoint = getSmEndpointById(submodelId)
    if (smEndpoint.trim() === '') {
      return false
    }

    const originalDocumentSmePath = buildAttachmentSmePath(smEndpoint, ['OriginalKblVecDocument'])
    const uploaded = await uploadAttachmentWithRetry(sourceFile, originalDocumentSmePath)
    if (!uploaded) {
      return false
    }

    return await synchronizeUploadedFileElement(originalDocumentSmePath, sourceFile)
  }

  async function uploadAttachmentWithRetry (sourceFile: File, attachmentPath: string): Promise<boolean> {
    const maxAttempts = 6
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const uploaded = await putAttachmentFile(sourceFile, attachmentPath)
      if (uploaded) {
        const fetchedAttachment = await fetchAttachmentFile(attachmentPath)
        if (fetchedAttachment && fetchedAttachment.size > 0) {
          return true
        }
      }

      await new Promise<void>(resolve => {
        const delayMs = Math.min(200 * attempt, 1200)
        setTimeout(resolve, delayMs)
      })
    }

    return false
  }

  async function synchronizeUploadedFileElement (fileElementPath: string, sourceFile: File): Promise<boolean> {
    const updatedSmeData = await fetchSme(fileElementPath)
    if (!updatedSmeData || typeof updatedSmeData !== 'object') {
      return false
    }

    const updatedFileObject = { ...(updatedSmeData as Record<string, unknown>) }
    delete updatedFileObject.id
    delete updatedFileObject.timestamp
    delete updatedFileObject.conceptDescriptions
    delete updatedFileObject.path

    updatedFileObject.contentType = determineContentType(sourceFile, 'application/octet-stream')

    const fileJsonable = updatedFileObject as Parameters<typeof jsonization.fileFromJsonable>[0]
    const instanceOrError = jsonization.fileFromJsonable(fileJsonable)
    if (instanceOrError.error !== null) {
      return false
    }

    const fileSME = instanceOrError.mustValue()
    return await putSubmodelElement(fileSME, fileElementPath)
  }

  async function persistSubmodelFromConversion (submodel: aasTypes.Submodel): Promise<boolean> {
    const originalId = submodel.id

    if (!ignoreDuplicates.value) {
      const alreadyExists = await smIsAvailableById(originalId)
      if (alreadyExists) {
        return false
      }

      const posted = await postSubmodel(submodel)
      if (!posted) return false

      await waitForSubmodelAvailability(submodel.id)
      return true
    }

    const uniqueId = await findNextAvailableSubmodelId(originalId)
    submodel.id = uniqueId
    const posted = await postSubmodel(submodel)
    if (!posted) return false

    await waitForSubmodelAvailability(submodel.id)
    return true
  }

  async function waitForSubmodelAvailability (submodelId: string): Promise<void> {
    const maxAttempts = 10
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const available = await smIsAvailableById(submodelId)
      if (available) return
      await yieldToUi()
    }

    console.warn(`[UploadAASKblVec] Submodel '${submodelId}' not yet available after POST; continuing due to eventual consistency.`)
  }

  async function findNextAvailableSubmodelId (currentId: string): Promise<string> {
    const currentExists = await smIsAvailableById(currentId)
    if (!currentExists) {
      return currentId
    }

    const { idBase, nextSuffix } = splitIdAndSuffix(currentId)
    let suffix = nextSuffix

    for (let attempt = 0; attempt < 1000; attempt++) {
      const candidateId = `${idBase}_${suffix}`
      const candidateExists = await smIsAvailableById(candidateId)
      if (!candidateExists) {
        return candidateId
      }

      suffix++
    }

    return currentId
  }

  async function persistAasFromConversion (aas: aasTypes.AssetAdministrationShell): Promise<boolean> {
    const created = await postAas(aas)
    if (created) return true

    if (!ignoreDuplicates.value) return false

    return await aasIsAvailableById(aas.id)
  }

  async function uploadProductImageIfProvided (): Promise<aasTypes.Resource | null> {
    const imageFile = getSelectedProductImage()
    if (!imageFile) return null

    const aasId = requiredFieldValues.value.aasId.trim()
    if (aasId === '') {
      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 7000,
        color: 'warning',
        btnColor: 'buttonText',
        text: 'Product image was selected but could not be uploaded because AAS Id is empty.',
      })
      return null
    }

    try {
      const uploaded = await putThumbnail(imageFile, aasId)
      if (!uploaded) {
        navigationStore.dispatchSnackbar({
          status: true,
          timeout: 9000,
          color: 'warning',
          btnColor: 'buttonText',
          text: 'AAS was created, but product image upload failed.',
        })
        return null
      }

      return new aasTypes.Resource(imageFile.name, imageFile.type || 'application/octet-stream')
    } catch (error) {
      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 9000,
        color: 'warning',
        btnColor: 'buttonText',
        baseError: 'AAS was created, but product image upload failed.',
        extendedError: stringifyUnknown(error),
      })

      return null
    }
  }

  function buildUploadFailureDetails (response: any, thrownError?: unknown, fileName?: string): string {
    const parts: string[] = []

    if (fileName && fileName.trim() !== '') {
      parts.push(`File: ${fileName}`)
    }

    const status = typeof response?.status === 'number' ? response.status : undefined
    if (status !== undefined) {
      parts.push(`HTTP status: ${status}`)
    }

    const backendData = response?.data
    if (backendData !== undefined) {
      const backendText = stringifyUnknown(backendData)
      if (backendText.trim() !== '') {
        parts.push(`Backend response: ${backendText}`)
      }

      const backendHint = buildBackendSpecificHint(backendData)
      if (backendHint !== '') {
        parts.push(`Hint: ${backendHint}`)
      }
    }

    if (thrownError !== undefined) {
      const thrownText = stringifyUnknown(thrownError)
      if (thrownText.trim() !== '') {
        parts.push(`Client error: ${thrownText}`)
      }
    }

    if (parts.length === 0) {
      parts.push('No detailed response body was returned by the server.')
    }

    parts.push(
      'Checks: upload endpoint reachable, KBL format accepted by backend, and IDs are not duplicates when Ignore Duplicates is off.',
    )

    return parts.join(' | ')
  }

  async function extractDataPointsFromCurrentFile (): Promise<void> {
    const runId = ++extractionRunId.value
    extractionError.value = ''
    extractionInProgress.value = false
    extractionProcessedNodes.value = 0
    dataPointSearch.value = ''
    debouncedDataPointSearch.value = ''
    extractedDataPoints.value = []
    selectedDataPointKeys.value = new Set()
    requiredFieldValues.value = createEmptyRequiredFieldValues()
    requiredFieldPaths.value = createEmptyRequiredFieldPaths()

    const file = getSelectedFile()
    if (!file) return
    if (!isStructuredXmlFile.value) return

    extractionInProgress.value = true

    try {
      const validationError = await uploadHandler(file)
      if (runId !== extractionRunId.value) return
      if (validationError && validationError.trim() !== '') {
        extractionError.value = validationError
        return
      }

      const parser = new DOMParser()
      const doc = parser.parseFromString(await file.text(), 'text/xml')

      const dataPoints = await collectDataPointsProgressive(doc.documentElement, processedNodes => {
        if (runId !== extractionRunId.value) return false
        extractionProcessedNodes.value = processedNodes
        return true
      })

      if (runId !== extractionRunId.value) return

      extractedDataPoints.value = dataPoints
      dataPointTree.value = buildDataPointTree(doc.documentElement)
      expandedRowKeys.value = new Set()
      selectedDataPointKeys.value = new Set(collectSelectableNodeKeys(dataPointTree.value))

      const inferred = inferRequiredFieldValues(dataPoints, doc, file.name, MAX_ELEMENT_SCAN_FOR_ALIAS_FALLBACK)
      requiredFieldValues.value = {
        ...inferred.values,
        shortId: file.name.replace(/\.(kbl|vec)$/i, '').slice(0, 50),
      }
      requiredFieldPaths.value = inferred.paths
    } catch (error) {
      if (runId !== extractionRunId.value) return
      extractionError.value = `Failed to extract KBL data points: ${stringifyUnknown(error)}`
    } finally {
      if (runId === extractionRunId.value) {
        extractionInProgress.value = false
      }
    }
  }

  async function collectDataPointsProgressive (
    root: Element,
    onProgress: (processedNodes: number) => boolean,
  ): Promise<ExtractedDataPoint[]> {
    const points: ExtractedDataPoint[] = []

    const rootName = root.localName ?? root.tagName
    const stack: Array<{ node: Element, path: string }> = [{ node: root, path: rootName }]
    const chunkSize = isVecFile.value ? EXTRACTION_CHUNK_SIZE_FOR_VEC : EXTRACTION_CHUNK_SIZE_FOR_KBL
    let processedNodes = 0
    let pointSequence = 0

    while (stack.length > 0) {
      for (let index = 0; index < chunkSize && stack.length > 0; index++) {
        const current = stack.pop()
        if (!current) continue

        processedNodes++
        const node = current.node
        const nodePath = current.path

        if (node.attributes.length > 0) {
          for (const attr of Array.from(node.attributes)) {
            const value = attr.value?.trim() ?? ''
            if (value === '') continue

            pointSequence++
            const key = `${nodePath}.@${attr.name}#${pointSequence}`
            points.push({ key, label: `${nodePath}.@${attr.name}`, value })
          }
        }

        const childElements = Array.from(node.children)
        if (childElements.length === 0) {
          let textValue = ''
          for (const childNode of Array.from(node.childNodes)) {
            if (childNode.nodeType === Node.TEXT_NODE || childNode.nodeType === Node.CDATA_SECTION_NODE) {
              textValue += childNode.textContent ?? ''
            }
          }

          textValue = textValue.trim()
          if (textValue !== '') {
            pointSequence++
            const key = `${nodePath}#${pointSequence}`
            points.push({ key, label: nodePath, value: textValue })
          }
        }

        for (let i = childElements.length - 1; i >= 0; i--) {
          const child = childElements[i]
          const childName = child.localName ?? child.tagName
          stack.push({ node: child, path: `${nodePath}.${childName}` })
        }
      }

      const shouldContinue = onProgress(processedNodes)
      if (!shouldContinue) return []
      await yieldToUi()
    }

    return points
  }

  async function yieldToUi (): Promise<void> {
    await new Promise<void>(resolve => {
      setTimeout(resolve, 0)
    })
  }

  function handleRowClick (row: DataPointTreeNode): void {
    if (row.selectable) {
      selectedDataPointKeys.value = toggleSelection(selectedDataPointKeys.value, row.key)
      return
    }

    if (row.hasChildren) {
      toggleRowExpanded(row.key)
    }
  }

  function toggleRowExpanded (key: string): void {
    const next = new Set(expandedRowKeys.value)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    expandedRowKeys.value = next
  }

  function selectAllDataPoints (): void {
    selectedDataPointKeys.value = new Set(collectSelectableNodeKeys(dataPointTree.value))
  }

  function clearDataPointSelection (): void {
    selectedDataPointKeys.value = new Set()
  }

  function resetState (): void {
    selectedFile.value = null
    productImageFile.value = null
    loading.value = false
    ignoreDuplicates.value = true
    extractionError.value = ''
    extractionInProgress.value = false
    extractionProcessedNodes.value = 0
    dataPointSearch.value = ''
    debouncedDataPointSearch.value = ''
    extractedDataPoints.value = []
    selectedDataPointKeys.value = new Set()
    dataPointTree.value = []
    expandedRowKeys.value = new Set()
    requiredFieldValues.value = createEmptyRequiredFieldValues()
    requiredFieldPaths.value = createEmptyRequiredFieldPaths()
    debugUploadPayload.value = false
    uploadDebugInfo.value = ''
  }
</script>
