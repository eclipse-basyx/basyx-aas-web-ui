<template>
  <v-dialog v-model="dialogModel" persistent width="860">
    <v-card>
      <v-card-title class="bg-cardHeader">
        {{ title }}
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-3 bg-card" style="overflow-y: auto">
        <v-alert
          v-if="localError"
          class="mb-3"
          density="comfortable"
          icon="mdi-alert-circle-outline"
          :text="localError"
          type="warning"
          variant="tonal"
        />

        <v-expansion-panels v-model="openPanels" multiple>
          <v-expansion-panel class="border-t-thin border-s-thin border-e-thin" :class="bordersToShow(0)">
            <v-expansion-panel-title>Details</v-expansion-panel-title>

            <v-expansion-panel-text>
              <v-row align="center">
                <v-col class="py-0">
                  <v-text-field
                    v-model="id"
                    clearable
                    density="comfortable"
                    :disabled="mode === 'edit'"
                    label="ID"
                    variant="outlined"
                  />
                </v-col>
              </v-row>

              <v-row align="center">
                <v-col class="py-0">
                  <v-text-field
                    v-model="idShort"
                    clearable
                    density="comfortable"
                    label="IdShort"
                    variant="outlined"
                  />
                </v-col>
              </v-row>

              <v-row align="center">
                <v-col class="py-0">
                  <v-textarea
                    v-model="description"
                    auto-grow
                    clearable
                    density="comfortable"
                    label="Description"
                    rows="2"
                    variant="outlined"
                  />
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <v-expansion-panel class="border-s-thin border-e-thin" :class="bordersToShow(1)">
            <v-expansion-panel-title>Asset</v-expansion-panel-title>

            <v-expansion-panel-text>
              <v-row align="center" class="mb-3">
                <v-col class="py-0" cols="12" md="6">
                  <v-select
                    v-model="assetKind"
                    clearable
                    density="comfortable"
                    :items="assetKindOptions"
                    label="Asset Kind"
                    variant="outlined"
                  />
                </v-col>

                <v-col class="py-0" cols="12" md="6">
                  <v-text-field
                    v-model="assetType"
                    clearable
                    density="comfortable"
                    label="Asset Type"
                    variant="outlined"
                  />
                </v-col>
              </v-row>

              <AssetIdInput
                v-model:global-asset-id="globalAssetId"
                v-model:specific-asset-ids="specificAssetIds"
                :show-generate-iri-for-global="true"
                :show-generate-iri-for-specific="true"
                :show-specific-asset-ids="true"
              />
            </v-expansion-panel-text>
          </v-expansion-panel>

          <v-expansion-panel class="border-s-thin border-e-thin" :class="bordersToShow(2)">
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
                  color="primary"
                  prepend-icon="mdi-plus"
                  text="Add Submodel Descriptor"
                  variant="outlined"
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

              <v-expansion-panels v-else multiple variant="accordion">
                <v-expansion-panel
                  v-for="(submodelDescriptor, submodelIndex) in submodelDescriptors"
                  :key="submodelDescriptor.localKey"
                  border
                  rounded="lg"
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
                          clearable
                          density="comfortable"
                          label="ID"
                          variant="outlined"
                        />
                      </v-col>

                      <v-col class="py-0" cols="12" md="6">
                        <v-text-field
                          v-model="submodelDescriptor.idShort"
                          clearable
                          density="comfortable"
                          label="IdShort"
                          variant="outlined"
                        />
                      </v-col>
                    </v-row>

                    <v-row align="center">
                      <v-col class="py-0" cols="12" md="6">
                        <v-text-field
                          v-model="submodelDescriptor.semanticIdValue"
                          clearable
                          density="comfortable"
                          label="Semantic ID"
                          variant="outlined"
                        />
                      </v-col>

                      <v-col class="py-0" cols="12" md="6">
                        <v-combobox
                          v-model="submodelDescriptor.supplementalSemanticIdValues"
                          chips
                          closable-chips
                          density="comfortable"
                          label="Supplemental Semantic IDs"
                          multiple
                          variant="outlined"
                        />
                      </v-col>
                    </v-row>

                    <div class="d-flex align-center justify-space-between ga-2 mt-2 mb-3">
                      <div class="text-subtitle-2">Endpoints</div>

                      <v-btn
                        prepend-icon="mdi-plus"
                        size="small"
                        text="Add Endpoint"
                        variant="tonal"
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
                            clearable
                            density="comfortable"
                            label="Interface"
                            variant="outlined"
                          />
                        </v-col>

                        <v-col class="py-0" cols="12" md="5">
                          <v-text-field
                            v-model="endpoint.href"
                            clearable
                            density="comfortable"
                            label="Href"
                            variant="outlined"
                          />
                        </v-col>

                        <v-col class="py-0" cols="12" md="3">
                          <v-text-field
                            v-model="endpoint.endpointProtocol"
                            clearable
                            density="comfortable"
                            label="Protocol"
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
        <v-btn :disabled="loading" @click="closeDialog">Cancel</v-btn>
        <v-btn color="primary" :loading="loading" @click="saveDescriptor">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import type { types as aasTypes } from '@aas-core-works/aas-core3.1-typescript'
  import { computed, ref, toRaw, watch } from 'vue'
  import AssetIdInput from '@/components/EditorComponents/InputTypes/AssetIdInput.vue'
  import {
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

  const assetKindOptions = ['Instance', 'Type']

  const openPanels = ref([0, 1, 2])
  const id = ref('')
  const idShort = ref('')
  const description = ref('')
  const assetKind = ref<string | null>('Instance')
  const assetType = ref('')
  const globalAssetId = ref<string | null>(null)
  const specificAssetIds = ref<Array<aasTypes.SpecificAssetId> | null>(null)
  const submodelDescriptors = ref<SubmodelDescriptorForm[]>([])
  const originalDescriptor = ref<Record<string, unknown> | null>(null)
  const localError = ref('')

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
    specificAssetIds.value = cloneValue(source?.specificAssetIds) ?? null
    submodelDescriptors.value = Array.isArray(source?.submodelDescriptors)
      ? source.submodelDescriptors.map(descriptor => toSubmodelForm(descriptor))
      : []
    localError.value = ''
  }

  function normalizeSpecificAssetIds (): Array<Record<string, unknown>> | null {
    const normalizedAssetIds: Array<Record<string, unknown>> = []

    for (const assetId of specificAssetIds.value ?? []) {
      const name = assetId?.name?.trim() ?? ''
      const value = assetId?.value?.trim() ?? ''

      if (name === '' && value === '') {
        continue
      }

      if (name === '' || value === '') {
        return null
      }

      normalizedAssetIds.push({
        ...cloneRecord(assetId),
        name,
        value,
      })
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

  function bordersToShow (index: number): string {
    const nextPanelIsOpen = openPanels.value.includes(index + 1)
    return nextPanelIsOpen ? 'border-b-0' : 'border-b-thin'
  }
</script>
