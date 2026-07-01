<template>
  <v-dialog
    v-model="dialogModel"
    :fullscreen="smAndDown"
    :max-width="smAndDown ? undefined : '1200px'"
    persistent
    transition="dialog-bottom-transition"
  >
    <v-sheet
      :border="!smAndDown"
      class="d-flex flex-column"
      :rounded="smAndDown ? undefined : 'lg'"
      :style="smAndDown ? { height: '100vh' } : undefined"
    >
      <v-card-title class="bg-cardHeader">{{ title }}</v-card-title>

      <v-divider />

      <v-card-text
        class="pt-1 overflow-y-auto"
        :style="smAndDown ? { flex: '1 1 auto', minHeight: '0' } : { maxHeight: 'calc(100vh - 200px)' }"
      >
        <v-alert
          v-if="localError"
          class="mb-3"
          density="comfortable"
          icon="mdi-alert-circle-outline"
          :text="localError"
          type="warning"
          variant="tonal"
        />

        <v-expansion-panels
          v-model="openPanels"
          gap="8"
          multiple
          rounded="lg"
          static
          variant="accordion"
        >
          <v-expansion-panel>
            <v-expansion-panel-title>Details</v-expansion-panel-title>

            <v-expansion-panel-text>
              <v-row align="center">
                <v-col class="py-0">
                  <v-text-field
                    v-model="id"
                    bg-color="surface-light"
                    clearable
                    density="compact"
                    :disabled="mode === 'edit'"
                    flat
                    label="ID"
                    single-line
                    variant="outlined"
                  />
                </v-col>
              </v-row>

              <v-row align="center">
                <v-col class="py-0">
                  <v-text-field
                    v-model="idShort"
                    bg-color="surface-light"
                    clearable
                    density="compact"
                    flat
                    label="IdShort"
                    single-line
                    variant="outlined"
                  />
                </v-col>
              </v-row>

              <v-row align="center">
                <v-col class="py-0">
                  <v-textarea
                    v-model="description"
                    auto-grow
                    bg-color="surface-light"
                    clearable
                    density="compact"
                    flat
                    label="Description"
                    rows="2"
                    variant="outlined"
                  />
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <v-expansion-panel>
            <v-expansion-panel-title>Asset</v-expansion-panel-title>

            <v-expansion-panel-text>
              <v-row align="center" class="mb-3">
                <v-col class="py-0" cols="12" md="6">
                  <v-select
                    v-model="assetKind"
                    bg-color="surface-light"
                    clearable
                    density="compact"
                    flat
                    :items="assetKindOptions"
                    label="Asset Kind"
                    single-line
                    variant="outlined"
                  />
                </v-col>

                <v-col class="py-0" cols="12" md="6">
                  <v-text-field
                    v-model="assetType"
                    bg-color="surface-light"
                    clearable
                    density="compact"
                    flat
                    label="Asset Type"
                    single-line
                    variant="outlined"
                  />
                </v-col>
              </v-row>

              <v-row align="center">
                <v-col class="py-0">
                  <v-text-field
                    v-model="globalAssetId"
                    bg-color="surface-light"
                    clearable
                    density="compact"
                    flat
                    label="Global Asset ID"
                    single-line
                    variant="outlined"
                  >
                    <template #append-inner>
                      <v-tooltip location="bottom" open-delay="600">
                        <template #activator="{ props: tooltipProps }">
                          <v-btn
                            v-bind="tooltipProps"
                            icon="mdi-auto-fix"
                            size="small"
                            variant="text"
                            @click.stop="globalAssetId = generateIri('GlobalAssetId')"
                          />
                        </template>

                        <span>Generate Global Asset ID</span>
                      </v-tooltip>
                    </template>
                  </v-text-field>
                </v-col>
              </v-row>

              <div class="d-flex align-center justify-space-between ga-2 mb-3">
                <div class="text-subtitle-2">Specific Asset IDs</div>

                <v-tooltip location="bottom" open-delay="600">
                  <template #activator="{ props: tooltipProps }">
                    <v-btn
                      v-bind="tooltipProps"
                      class="text-buttonText"
                      color="primary"
                      prepend-icon="mdi-plus"
                      rounded="lg"
                      size="small"
                      text="Add"
                      variant="flat"
                      @click="addSpecificAssetId"
                    />
                  </template>

                  <span>Add specific asset ID</span>
                </v-tooltip>
              </div>

              <v-empty-state
                v-if="specificAssetIds.length === 0"
                class="text-divider"
                icon="mdi-tag-off-outline"
                text="No specific asset IDs are configured for this descriptor."
                title="No specific asset IDs"
              />

              <v-sheet
                v-for="(assetId, assetIdIndex) in specificAssetIds"
                :key="assetId.localKey"
                border
                class="pa-3 mb-3"
                rounded="lg"
              >
                <div class="d-flex align-center justify-space-between ga-2 mb-2">
                  <div class="text-caption text-medium-emphasis">Specific Asset ID {{ assetIdIndex + 1 }}</div>

                  <v-btn
                    icon="mdi-delete"
                    size="small"
                    variant="text"
                    @click="removeSpecificAssetId(assetIdIndex)"
                  />
                </div>

                <v-row density="comfortable">
                  <v-col cols="12" md="5">
                    <v-combobox
                      v-model="assetId.name"
                      bg-color="surface-light"
                      clearable
                      density="compact"
                      flat
                      :items="specificAssetIdNameOptions"
                      label="Name"
                      single-line
                      variant="outlined"
                    />
                  </v-col>

                  <v-col cols="12" md="7">
                    <v-combobox
                      v-model="assetId.value"
                      bg-color="surface-light"
                      clearable
                      density="compact"
                      flat
                      :items="getSpecificAssetIdValueOptions(assetId.name)"
                      label="Value"
                      single-line
                      variant="outlined"
                    >
                      <template #append-inner>
                        <v-tooltip location="bottom" open-delay="600">
                          <template #activator="{ props: tooltipProps }">
                            <v-btn
                              v-bind="tooltipProps"
                              icon="mdi-auto-fix"
                              size="small"
                              variant="text"
                              @click.stop="assetId.value = generateIri('SpecificAssetId')"
                            />
                          </template>

                          <span>Generate Specific Asset ID</span>
                        </v-tooltip>
                      </template>
                    </v-combobox>
                  </v-col>

                  <v-col cols="12">
                    <v-combobox
                      v-model="assetId.externalSubjectMarkerValues"
                      bg-color="surface-light"
                      chips
                      closable-chips
                      density="compact"
                      flat
                      :items="getSpecificAssetIdMarkerOptions(assetId.name)"
                      label="External Subject Markers"
                      multiple
                      variant="outlined"
                    />
                  </v-col>
                </v-row>
              </v-sheet>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <v-expansion-panel>
            <v-expansion-panel-title>
              <div class="d-flex align-center justify-space-between ga-2 w-100">
                <span>Submodel Descriptors</span>

                <v-chip size="small" variant="tonal">
                  {{ submodelDescriptors.length }}
                </v-chip>
              </div>
            </v-expansion-panel-title>

            <v-expansion-panel-text>
              <div class="d-flex justify-end mb-3">
                <v-btn
                  class="text-buttonText"
                  color="primary"
                  prepend-icon="mdi-plus"
                  rounded="lg"
                  size="small"
                  text="Add Submodel Descriptor"
                  variant="flat"
                  @click="addSubmodelDescriptor"
                />
              </div>

              <v-empty-state
                v-if="submodelDescriptors.length === 0"
                class="text-divider"
                icon="mdi-view-module-outline"
                text="No submodel descriptors are part of this AAS descriptor."
                title="No submodel descriptors"
              />

              <v-expansion-panels
                v-else
                gap="8"
                multiple
                rounded="lg"
                static
                variant="accordion"
              >
                <v-expansion-panel
                  v-for="(submodelDescriptor, submodelIndex) in submodelDescriptors"
                  :key="submodelDescriptor.localKey"
                >
                  <v-expansion-panel-title>
                    <div class="d-flex align-center ga-2 w-100">
                      <div class="flex-grow-1">
                        <div class="text-body-medium text-break">
                          {{ submodelDescriptor.idShort.trim() || 'Submodel Descriptor' }}
                        </div>

                        <div
                          class="text-caption text-medium-emphasis text-break"
                          style="font-size: 0.7rem; line-height: 1rem"
                        >
                          {{ submodelDescriptor.id.trim() || 'No ID yet' }}
                        </div>
                      </div>

                      <v-btn
                        icon="mdi-delete"
                        size="small"
                        variant="text"
                        @click.stop="removeSubmodelDescriptor(submodelIndex)"
                      />
                    </div>
                  </v-expansion-panel-title>

                  <v-expansion-panel-text>
                    <v-row align="center">
                      <v-col class="py-0" cols="12" md="6">
                        <v-text-field
                          v-model="submodelDescriptor.id"
                          bg-color="surface-light"
                          clearable
                          density="compact"
                          flat
                          label="ID"
                          single-line
                          variant="outlined"
                        />
                      </v-col>

                      <v-col class="py-0" cols="12" md="6">
                        <v-text-field
                          v-model="submodelDescriptor.idShort"
                          bg-color="surface-light"
                          clearable
                          density="compact"
                          flat
                          label="IdShort"
                          single-line
                          variant="outlined"
                        />
                      </v-col>
                    </v-row>

                    <v-row align="center">
                      <v-col class="py-0" cols="12" md="6">
                        <v-text-field
                          v-model="submodelDescriptor.semanticIdValue"
                          bg-color="surface-light"
                          clearable
                          density="compact"
                          flat
                          label="Semantic ID"
                          single-line
                          variant="outlined"
                        />
                      </v-col>

                      <v-col class="py-0" cols="12" md="6">
                        <v-combobox
                          v-model="submodelDescriptor.supplementalSemanticIdValues"
                          bg-color="surface-light"
                          chips
                          closable-chips
                          density="compact"
                          flat
                          label="Supplemental Semantic IDs"
                          multiple
                          variant="outlined"
                        />
                      </v-col>
                    </v-row>

                    <div class="d-flex align-center justify-space-between ga-2 mt-2 mb-3">
                      <div class="text-subtitle-2">Endpoints</div>

                      <v-btn
                        class="text-buttonText"
                        color="primary"
                        prepend-icon="mdi-plus"
                        rounded="lg"
                        size="small"
                        text="Add Endpoint"
                        variant="flat"
                        @click="addSubmodelEndpoint(submodelDescriptor)"
                      />
                    </div>

                    <v-empty-state
                      v-if="submodelDescriptor.endpoints.length === 0"
                      class="text-divider"
                      icon="mdi-information-outline"
                      text="No endpoints are configured for this submodel descriptor."
                      title="No endpoints"
                    />

                    <v-sheet
                      v-for="(endpoint, endpointIndex) in submodelDescriptor.endpoints"
                      :key="endpoint.localKey"
                      border
                      class="pa-3 mb-3"
                      rounded="lg"
                    >
                      <div class="d-flex align-center justify-space-between ga-2 mb-2">
                        <div class="text-caption text-medium-emphasis">
                          Endpoint {{ endpointIndex + 1 }}
                        </div>

                        <v-btn
                          icon="mdi-delete"
                          size="small"
                          variant="text"
                          @click="removeSubmodelEndpoint(submodelDescriptor, endpointIndex)"
                        />
                      </div>

                      <v-row align="center">
                        <v-col class="py-0" cols="12" md="4">
                          <v-text-field
                            v-model="endpoint.interfaceName"
                            bg-color="surface-light"
                            clearable
                            density="compact"
                            flat
                            label="Interface"
                            single-line
                            variant="outlined"
                          />
                        </v-col>

                        <v-col class="py-0" cols="12" md="5">
                          <v-text-field
                            v-model="endpoint.href"
                            bg-color="surface-light"
                            clearable
                            density="compact"
                            flat
                            label="Href"
                            single-line
                            variant="outlined"
                          />
                        </v-col>

                        <v-col class="py-0" cols="12" md="3">
                          <v-text-field
                            v-model="endpoint.endpointProtocol"
                            bg-color="surface-light"
                            clearable
                            density="compact"
                            flat
                            label="Protocol"
                            single-line
                            variant="outlined"
                          />
                        </v-col>
                      </v-row>
                    </v-sheet>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />
        <v-btn :disabled="loading" rounded="lg" text="Cancel" @click="closeDialog" />

        <v-btn
          class="text-buttonText"
          color="primary"
          :loading="loading"
          rounded="lg"
          text="Save"
          variant="flat"
          @click="saveDescriptor"
        />
      </v-card-actions>
    </v-sheet>
  </v-dialog>
</template>

<script lang="ts" setup>
  import { computed, ref, toRaw, watch } from 'vue'
  import { useDisplay } from 'vuetify'
  import { useIDUtils } from '@/composables/IDUtils'
  import {
    getExternalSubjectMarkerValues,
    getLangStringText,
    getReferenceKeyValues,
    normalizeSupplementalSemanticIds,
  } from '@/pages/modules/CatenaXplorer/catenaXplorerUtils'

  interface EndpointForm {
    endpointProtocol: string
    href: string
    interfaceName: string
    localKey: string
    source: Record<string, unknown>
  }

  interface SubmodelDescriptorForm {
    endpoints: EndpointForm[]
    id: string
    idShort: string
    localKey: string
    semanticIdValue: string
    source: Record<string, unknown>
    supplementalSemanticIdValues: string[]
  }

  interface SpecificAssetIdForm {
    externalSubjectMarkerValues: string[]
    localKey: string
    name: string
    source: Record<string, unknown>
    value: string
  }

  const props = withDefaults(
    defineProps<{
      descriptor?: Record<string, any> | null
      loading?: boolean
      mode?: 'create' | 'edit'
      modelValue: boolean
    }>(),
    {
      descriptor: null,
      loading: false,
      mode: 'create',
    },
  )

  const emit = defineEmits<{
    (event: 'update:model-value', value: boolean): void
    (event: 'save', value: Record<string, unknown>): void
  }>()

  const display = useDisplay()
  const { generateIri } = useIDUtils()
  const assetKindOptions = ['Instance', 'Type']
  const specificAssetIdNameOptions = ['customerPartId', 'manufacturerPartId']
  const specificAssetIdMarkerOptionsByName: Record<string, string[]> = {
    manufacturerPartId: ['PUBLIC_READABLE'],
  }

  const openPanels = ref([0, 1, 2])
  const id = ref('')
  const idShort = ref('')
  const description = ref('')
  const assetKind = ref<string | null>('Instance')
  const assetType = ref('')
  const globalAssetId = ref<string | null>(null)
  const specificAssetIds = ref<SpecificAssetIdForm[]>([])
  const submodelDescriptors = ref<SubmodelDescriptorForm[]>([])
  const originalDescriptor = ref<Record<string, unknown> | null>(null)
  const localError = ref('')

  const smAndDown = computed(() => display.smAndDown.value)
  const title = computed(() => props.mode === 'edit' ? 'Edit AAS Descriptor' : 'Create AAS Descriptor')

  const dialogModel = computed({
    get: () => props.modelValue,
    set: value => emit('update:model-value', value),
  })

  watch(
    () => props.modelValue,
    isOpen => {
      if (isOpen) {
        resetForm()
      }
    },
  )

  watch(
    () => props.descriptor,
    () => {
      if (props.modelValue) {
        resetForm()
      }
    },
  )

  function saveDescriptor (): void {
    localError.value = ''

    const normalizedId = id.value.trim()
    if (normalizedId === '') {
      localError.value = 'Enter an AAS descriptor ID.'
      return
    }

    const normalizedSpecificAssetIds = normalizeSpecificAssetIds()
    if (normalizedSpecificAssetIds === null) {
      localError.value = 'Specific asset IDs need both a name and a value.'
      return
    }

    const normalizedSubmodelDescriptors = normalizeSubmodelDescriptors()
    if (normalizedSubmodelDescriptors === null) {
      return
    }

    const descriptor = cloneRecord(originalDescriptor.value) ?? {}
    descriptor.endpoints = Array.isArray(originalDescriptor.value?.endpoints)
      ? cloneValue(originalDescriptor.value.endpoints)
      : []
    descriptor.id = normalizedId

    setOptionalString(descriptor, 'idShort', idShort.value)
    setOptionalString(descriptor, 'assetKind', assetKind.value)
    setOptionalString(descriptor, 'assetType', assetType.value)
    setOptionalString(descriptor, 'globalAssetId', globalAssetId.value)

    const normalizedDescription = description.value.trim()
    if (normalizedDescription === '') {
      delete descriptor.description
    } else {
      descriptor.description = [{ language: 'en', text: normalizedDescription }]
    }

    if (normalizedSpecificAssetIds.length > 0) {
      descriptor.specificAssetIds = normalizedSpecificAssetIds
    } else {
      delete descriptor.specificAssetIds
    }

    if (normalizedSubmodelDescriptors.length > 0) {
      descriptor.submodelDescriptors = normalizedSubmodelDescriptors
    } else {
      delete descriptor.submodelDescriptors
    }

    emit('save', descriptor)
  }

  function closeDialog (): void {
    if (props.loading) {
      return
    }

    dialogModel.value = false
  }

  function resetForm (): void {
    const source = cloneRecord(props.descriptor)
    originalDescriptor.value = source
    openPanels.value = [0, 1, 2]
    id.value = source?.id ?? ''
    idShort.value = source?.idShort ?? ''
    description.value = getLangStringText(source?.description)
    assetKind.value = source?.assetKind ?? (props.mode === 'create' ? 'Instance' : null)
    assetType.value = source?.assetType ?? ''
    globalAssetId.value = source?.globalAssetId ?? null
    specificAssetIds.value = Array.isArray(source?.specificAssetIds)
      ? source.specificAssetIds.map(assetId => toSpecificAssetIdForm(assetId))
      : []
    submodelDescriptors.value = Array.isArray(source?.submodelDescriptors)
      ? source.submodelDescriptors.map(descriptor => toSubmodelForm(descriptor))
      : []
    localError.value = ''
  }

  function normalizeSpecificAssetIds (): Array<Record<string, unknown>> | null {
    const normalizedAssetIds: Array<Record<string, unknown>> = []

    for (const assetId of specificAssetIds.value) {
      const name = assetId.name.trim()
      const value = assetId.value.trim()

      if (name === '' && value === '') {
        continue
      }

      if (name === '' || value === '') {
        return null
      }

      const normalizedAssetId = cloneRecord(assetId.source) ?? {}
      normalizedAssetId.name = name
      normalizedAssetId.value = value

      const externalSubjectMarkerValues = uniqueNonEmpty(assetId.externalSubjectMarkerValues)
      if (externalSubjectMarkerValues.length > 0) {
        normalizedAssetId.externalSubjectId = createExternalReferenceFromValues(externalSubjectMarkerValues)
      } else {
        delete normalizedAssetId.externalSubjectId
      }

      normalizedAssetIds.push(normalizedAssetId)
    }

    return normalizedAssetIds
  }

  function normalizeSubmodelDescriptors (): Array<Record<string, unknown>> | null {
    const normalizedDescriptors: Array<Record<string, unknown>> = []

    for (const [index, submodelDescriptor] of submodelDescriptors.value.entries()) {
      const normalizedId = submodelDescriptor.id.trim()
      if (normalizedId === '') {
        localError.value = `Enter an ID for submodel descriptor ${index + 1}.`
        return null
      }

      const normalizedEndpoints = normalizeEndpoints(submodelDescriptor, index)
      if (normalizedEndpoints === null) {
        return null
      }

      const descriptor = cloneRecord(submodelDescriptor.source) ?? {}
      descriptor.id = normalizedId
      descriptor.endpoints = normalizedEndpoints
      setOptionalString(descriptor, 'idShort', submodelDescriptor.idShort)

      const semanticIdValue = submodelDescriptor.semanticIdValue.trim()
      if (semanticIdValue === '') {
        delete descriptor.semanticId
      } else {
        descriptor.semanticId = createExternalReference(semanticIdValue)
      }

      const supplementalSemanticIdValues = uniqueNonEmpty(submodelDescriptor.supplementalSemanticIdValues)
      if (supplementalSemanticIdValues.length > 0) {
        descriptor.supplementalSemanticIds = supplementalSemanticIdValues.map(value => createExternalReference(value))
      } else {
        delete descriptor.supplementalSemanticIds
      }
      delete descriptor.supplementalSemanticId

      normalizedDescriptors.push(descriptor)
    }

    return normalizedDescriptors
  }

  function normalizeEndpoints (
    submodelDescriptor: SubmodelDescriptorForm,
    submodelIndex: number,
  ): Array<Record<string, unknown>> | null {
    const endpoints: Array<Record<string, unknown>> = []

    for (const [endpointIndex, endpoint] of submodelDescriptor.endpoints.entries()) {
      const interfaceName = endpoint.interfaceName.trim()
      const href = endpoint.href.trim()
      const endpointProtocol = endpoint.endpointProtocol.trim()

      if (interfaceName === '' && href === '' && endpointProtocol === '') {
        continue
      }

      if (href === '') {
        localError.value = `Enter an href for endpoint ${endpointIndex + 1} of submodel descriptor ${submodelIndex + 1}.`
        return null
      }

      const normalizedEndpoint = cloneRecord(endpoint.source) ?? {}
      const protocolInformation = cloneRecord(normalizedEndpoint.protocolInformation) ?? {}
      protocolInformation.href = href
      setOptionalString(protocolInformation, 'endpointProtocol', endpointProtocol)
      normalizedEndpoint.interface = interfaceName || 'SUBMODEL-3.0'
      normalizedEndpoint.protocolInformation = protocolInformation
      endpoints.push(normalizedEndpoint)
    }

    return endpoints
  }

  function toSubmodelForm (descriptor: Record<string, any>): SubmodelDescriptorForm {
    return {
      endpoints: Array.isArray(descriptor?.endpoints)
        ? descriptor.endpoints.map(endpoint => toEndpointForm(endpoint))
        : [],
      id: descriptor?.id ?? '',
      idShort: descriptor?.idShort ?? '',
      localKey: createLocalKey(),
      semanticIdValue: getReferenceKeyValues(descriptor?.semanticId)[0] ?? '',
      source: cloneRecord(descriptor) ?? {},
      supplementalSemanticIdValues: uniqueNonEmpty(
        normalizeSupplementalSemanticIds(descriptor).flatMap(reference => getReferenceKeyValues(reference)),
      ),
    }
  }

  function toSpecificAssetIdForm (assetId: Record<string, any>): SpecificAssetIdForm {
    return {
      externalSubjectMarkerValues: getExternalSubjectMarkerValues(assetId),
      localKey: createLocalKey(),
      name: assetId?.name ?? '',
      source: cloneRecord(assetId) ?? {},
      value: assetId?.value ?? '',
    }
  }

  function toEndpointForm (endpoint: Record<string, any>): EndpointForm {
    return {
      endpointProtocol: endpoint?.protocolInformation?.endpointProtocol ?? '',
      href: endpoint?.protocolInformation?.href ?? '',
      interfaceName: endpoint?.interface ?? '',
      localKey: createLocalKey(),
      source: cloneRecord(endpoint) ?? {},
    }
  }

  function addSubmodelDescriptor (): void {
    submodelDescriptors.value.push({
      endpoints: [],
      id: '',
      idShort: '',
      localKey: createLocalKey(),
      semanticIdValue: '',
      source: {},
      supplementalSemanticIdValues: [],
    })
  }

  function addSpecificAssetId (): void {
    specificAssetIds.value.push({
      externalSubjectMarkerValues: [],
      localKey: createLocalKey(),
      name: '',
      source: {},
      value: '',
    })
  }

  function removeSpecificAssetId (index: number): void {
    specificAssetIds.value.splice(index, 1)
  }

  function getSpecificAssetIdMarkerOptions (name: string): string[] {
    return specificAssetIdMarkerOptionsByName[name.trim()] ?? []
  }

  function getSpecificAssetIdValueOptions (_name: string): string[] {
    return []
  }

  function removeSubmodelDescriptor (index: number): void {
    submodelDescriptors.value.splice(index, 1)
  }

  function addSubmodelEndpoint (submodelDescriptor: SubmodelDescriptorForm): void {
    submodelDescriptor.endpoints.push({
      endpointProtocol: 'HTTP',
      href: '',
      interfaceName: 'SUBMODEL-3.0',
      localKey: createLocalKey(),
      source: {},
    })
  }

  function removeSubmodelEndpoint (submodelDescriptor: SubmodelDescriptorForm, endpointIndex: number): void {
    submodelDescriptor.endpoints.splice(endpointIndex, 1)
  }

  function createExternalReference (value: string): Record<string, unknown> {
    return {
      type: 'ExternalReference',
      keys: [
        {
          type: 'GlobalReference',
          value,
        },
      ],
    }
  }

  function createExternalReferenceFromValues (values: string[]): Record<string, unknown> {
    return {
      type: 'ExternalReference',
      keys: values.map(value => ({
        type: 'GlobalReference',
        value,
      })),
    }
  }

  function setOptionalString (target: Record<string, unknown>, key: string, value: unknown): void {
    const normalizedValue = typeof value === 'string' ? value.trim() : ''
    if (normalizedValue === '') {
      delete target[key]
    } else {
      target[key] = normalizedValue
    }
  }

  function cloneRecord<T extends Record<string, any>> (value: T | null | undefined): Record<string, any> | null {
    if (!value || typeof value !== 'object') {
      return null
    }

    return cloneValue(value)
  }

  function cloneValue<T> (value: T): T {
    return value === undefined ? value : structuredClone(toRaw(value))
  }

  function uniqueNonEmpty (values: unknown[]): string[] {
    return Array.from(new Set(
      values
        .map(value => typeof value === 'string' ? value.trim() : '')
        .filter(value => value !== ''),
    ))
  }

  function createLocalKey (): string {
    return crypto.randomUUID()
  }
</script>
