<template>
  <v-dialog v-model="dialog" persistent width="900">
    <v-card v-if="draft">
      <v-card-title>{{ isNew ? `Create ${modelType}` : `Edit ${modelType}` }}</v-card-title>
      <v-divider />

      <v-card-text class="bg-card pa-3" style="overflow-y: auto">
        <v-alert
          v-if="validationMessages.length > 0"
          class="mb-3"
          density="compact"
          type="error"
          variant="tonal"
        >
          <div v-for="message in validationMessages" :key="message">{{ message }}</div>
        </v-alert>

        <v-expansion-panels v-model="openPanels" multiple>
          <v-expansion-panel value="details">
            <v-expansion-panel-title>Details</v-expansion-panel-title>

            <v-expansion-panel-text>
              <TextInput v-model="draft.idShort" :error-messages="fieldError('idShort')" label="IdShort" />
              <MultiLanguageTextInput v-model="draft.displayName" label="Display Name" :show-label="true" type="displayName" />
              <MultiLanguageTextInput v-model="draft.description" label="Description" :show-label="true" type="description" />

              <SelectInput
                v-model="draft.category"
                :clearable="true"
                :error-messages="fieldError('category')"
                label="Category"
                type="category"
              />
            </v-expansion-panel-text>
          </v-expansion-panel>

          <v-expansion-panel v-if="hasValuePanel" value="value">
            <v-expansion-panel-title>{{ modelType === 'BasicEventElement' ? 'Event' : 'Value' }}</v-expansion-panel-title>

            <v-expansion-panel-text>
              <template v-if="modelType === 'Property'">
                <SelectInput v-model="draft.valueType" :error-messages="fieldError('valueType')" label="Data Type" type="dataType" />
                <TextInput v-model="draft.value" :error-messages="fieldError('value')" label="Value" />
              </template>

              <template v-else-if="modelType === 'MultiLanguageProperty'">
                <MultiLanguageTextInput v-model="draft.value" label="Value" :show-label="true" type="description" />
              </template>

              <template v-else-if="modelType === 'Range'">
                <SelectInput v-model="draft.valueType" :error-messages="fieldError('valueType')" label="Data Type" type="dataType" />
                <RangeInput v-model:max-value="draft.max" v-model:min-value="draft.min" />
                <v-messages v-if="fieldError('min') || fieldError('max')" active color="error" :messages="fieldErrors('min', 'max')" />
              </template>

              <template v-else-if="modelType === 'File'">
                <v-alert
                  v-if="detached"
                  class="mb-3"
                  density="compact"
                  type="info"
                  variant="tonal"
                >
                  Operation variables have no attachment endpoint. File metadata and path can still be edited.
                </v-alert>

                <TextInput v-model="draft.contentType" :error-messages="fieldError('contentType')" label="Content Type" />
                <TextInput v-model="draft.value" :error-messages="fieldError('value')" label="Path or URL" />
              </template>

              <template v-else-if="modelType === 'Blob'">
                <BlobInput
                  v-model:content="draft.value"
                  v-model:content-type="draft.contentType"
                  :new-blob="isNew"
                />

                <v-messages v-if="fieldError('contentType') || fieldError('value')" active color="error" :messages="fieldErrors('contentType', 'value')" />
              </template>

              <template v-else-if="modelType === 'ReferenceElement'">
                <ReferenceInput v-model="draft.value" :error-messages="fieldError('value')" label="Value" :show-remove-button="true" />
              </template>

              <template v-else-if="['RelationshipElement', 'AnnotatedRelationshipElement'].includes(modelType)">
                <ReferenceInput v-model="draft.first" :error-messages="fieldError('first')" label="First" />
                <ReferenceInput v-model="draft.second" :error-messages="fieldError('second')" label="Second" />

                <v-alert v-if="modelType === 'AnnotatedRelationshipElement'" density="compact" type="info" variant="tonal">
                  Annotations are managed as child elements in the tree.
                </v-alert>
              </template>

              <template v-else-if="modelType === 'Entity'">
                <SelectInput v-model="draft.entityType" :error-messages="fieldError('entityType')" label="Entity Type" type="entityType" />
                <TextInput v-model="draft.globalAssetId" :error-messages="fieldError('globalAssetId')" label="Global Asset ID" />
                <v-alert density="compact" type="info" variant="tonal">Statements are managed as child elements in the tree.</v-alert>
              </template>

              <template v-else-if="modelType === 'SubmodelElementList'">
                <SelectInput v-model="draft.typeValueListElement" :error-messages="fieldError('typeValueListElement')" label="Element Type" type="elementType" />

                <SelectInput
                  v-model="draft.valueTypeListElement"
                  :clearable="true"
                  :error-messages="fieldError('valueTypeListElement')"
                  label="Value Type"
                  type="dataType"
                />

                <BooleanInput v-model="draft.orderRelevant" label="Order Relevant" />
                <v-alert density="compact" type="info" variant="tonal">List values are managed as child elements in the tree.</v-alert>
              </template>

              <template v-else-if="modelType === 'SubmodelElementCollection'">
                <v-alert density="compact" type="info" variant="tonal">Collection values are managed as child elements in the tree.</v-alert>
              </template>

              <template v-else-if="modelType === 'Operation'">
                <v-row>
                  <v-col v-for="count in operationCounts" :key="count.label">
                    <v-card border variant="flat"><v-card-text class="text-center">
                      <div class="text-h6">{{ count.value }}</div><div class="text-caption">{{ count.label }}</div>
                    </v-card-text></v-card>
                  </v-col>
                </v-row>

                <v-alert class="mt-3" density="compact" type="info" variant="tonal">
                  Operation variables are managed beneath this Operation in the tree.
                </v-alert>
              </template>

              <template v-else-if="modelType === 'BasicEventElement'">
                <v-alert class="mb-3" density="compact" type="warning" variant="tonal">
                  BasicEventElement is experimental in AAS Core 3.1.
                </v-alert>

                <ReferenceInput v-model="draft.observed" :error-messages="fieldError('observed')" label="Observed" />
                <SelectInput v-model="draft.direction" :error-messages="fieldError('direction')" label="Direction" type="direction" />
                <SelectInput v-model="draft.state" :error-messages="fieldError('state')" label="State" type="stateOfEvent" />
                <TextInput v-model="draft.messageTopic" :error-messages="fieldError('messageTopic')" label="Message Topic" />
                <ReferenceInput v-model="draft.messageBroker" :error-messages="fieldError('messageBroker')" label="Message Broker" :show-remove-button="true" />
                <TextInput v-model="draft.lastUpdate" :error-messages="fieldError('lastUpdate')" label="Last Update (xs:dateTime)" />
                <TextInput v-model="draft.minInterval" :error-messages="fieldError('minInterval')" label="Minimum Interval (xs:duration)" />
                <TextInput v-if="draft.direction === outputDirection" v-model="draft.maxInterval" :error-messages="fieldError('maxInterval')" label="Maximum Interval (xs:duration)" />
              </template>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <v-expansion-panel value="semantic">
            <v-expansion-panel-title>Semantic ID</v-expansion-panel-title>

            <v-expansion-panel-text>
              <ReferenceInput v-model="draft.semanticId" :error-messages="fieldError('semanticId')" label="Semantic ID" :show-remove-button="true" />
            </v-expansion-panel-text>
          </v-expansion-panel>

          <v-expansion-panel value="qualifiers">
            <v-expansion-panel-title>Qualifiers</v-expansion-panel-title>
            <v-expansion-panel-text><QualifierInput v-model="draft.qualifiers" /></v-expansion-panel-text>
          </v-expansion-panel>

          <v-expansion-panel value="dataSpecification">
            <v-expansion-panel-title>Data Specification</v-expansion-panel-title>
            <v-expansion-panel-text><EmbeddedDataSpecificationInput v-model="draft.embeddedDataSpecifications" /></v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />
        <v-btn @click="dialog = false">Cancel</v-btn>
        <v-btn color="primary" :loading="saving" @click="save">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import type { types as aasTypes } from '@aas-core-works/aas-core3.1-typescript'
  import type { JsonValue } from '@aas-core-works/aas-core3.1-typescript/jsonization'
  import { jsonization, types } from '@aas-core-works/aas-core3.1-typescript'
  import { computed, nextTick, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useOperationTreeMutation } from '@/composables/AAS/OperationTreeMutation'
  import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient'
  import { buildVerificationSummary, verifyForEditor } from '@/composables/MetamodelVerification'
  import { useNavigationStore } from '@/store/NavigationStore'
  import {
    canonicalTreeElementJson,
    createOperationPersistenceBoundary,
    stripTreeMetadata,
  } from '@/utils/AAS/OperationTreeUtils'
  import { getCreatedSubmodelElementPath } from '@/utils/AAS/SubmodelElementPathUtils'
  import { base64Decode } from '@/utils/EncodeDecodeUtils'

  const props = withDefaults(defineProps<{
    modelValue: boolean
    modelType: string
    isNew: boolean
    detached?: boolean
    element?: any
    idShortOptional?: boolean
    parentElement?: any
    path?: string
  }>(), {
    detached: false,
    element: undefined,
    idShortOptional: false,
    parentElement: undefined,
    path: undefined,
  })

  type DetachedSaveCompletion = (success: boolean, messages?: string[]) => void

  const emit = defineEmits<{
    'update:model-value': [value: boolean]
    'saved': [value: JsonValue, complete: DetachedSaveCompletion]
  }>()

  const route = useRoute()
  const router = useRouter()
  const navigationStore = useNavigationStore()
  const { fetchSme, postSubmodelElement, putSubmodelElement } = useSMRepositoryClient()
  const { mutateOperation } = useOperationTreeMutation()

  const dialog = ref(false)
  const draft = ref<any>()
  const errors = ref<Map<string, string>>(new Map())
  const validationMessages = ref<string[]>([])
  const saving = ref(false)
  const openPanels = ref(['details', 'value'])
  const initialDraftJson = ref<JsonValue>()
  const outputDirection = types.Direction.Output

  const modelType = computed(() => props.modelType || getModelType(draft.value))
  const hasValuePanel = computed(() => modelType.value !== 'Capability')
  const operationCounts = computed(() => [
    { label: 'Input', value: draft.value?.inputVariables?.length ?? 0 },
    { label: 'In/Out', value: draft.value?.inoutputVariables?.length ?? 0 },
    { label: 'Output', value: draft.value?.outputVariables?.length ?? 0 },
  ])

  watch(
    () => props.modelValue,
    async value => {
      dialog.value = value
      if (value) await initialize()
    },
    { immediate: true },
  )
  watch(dialog, value => emit('update:model-value', value))

  async function initialize (): Promise<void> {
    errors.value.clear()
    validationMessages.value = []
    if (props.isNew) {
      draft.value = createElement(props.modelType)
      initialDraftJson.value = jsonization.toJsonable(draft.value)
      return
    }
    const source = props.detached ? stripTreeMetadata(props.element) : await fetchSme(props.path || props.element?.path)
    const parsed = jsonization.submodelElementFromJsonable(source as JsonValue)
    if (parsed.error !== null) {
      showError('Unable to open SubmodelElement.', parsed.error.message || String(parsed.error))
      dialog.value = false
      return
    }
    draft.value = parsed.mustValue()
    initialDraftJson.value = jsonization.toJsonable(draft.value)
  }

  async function save (): Promise<void> {
    errors.value.clear()
    validationMessages.value = []
    if (!draft.value) return
    const optionalIdShort = props.idShortOptional
      || props.parentElement?.modelType === 'SubmodelElementList'
      || props.element?.isDirectOperationVariable
    if (!draft.value.idShort && !optionalIdShort) {
      errors.value.set('idShort', 'IdShort is required.')
      return
    }
    if (modelType.value === 'BasicEventElement' && draft.value.direction === types.Direction.Input) {
      draft.value.maxInterval = null
    }

    const verificationResult = verifyForEditor(draft.value, { maxErrors: 20 })
    if (!verificationResult.isValid) {
      for (const [field, message] of verificationResult.fieldErrors) errors.value.set(field, message)
      validationMessages.value = verificationResult.issues.map(issue => issue.path ? `${issue.path}: ${issue.message}` : issue.message)
      if (validationMessages.value.length === 0) validationMessages.value = [buildVerificationSummary(verificationResult)]
      revealFirstValidationError(verificationResult.issues[0]?.path || '')
      showError('SubmodelElement validation failed.', validationMessages.value[0])
      return
    }

    const json = jsonization.toJsonable(draft.value as aasTypes.ISubmodelElement)
    if (props.detached) {
      saving.value = true
      emit('saved', json, (success, messages = []) => {
        saving.value = false
        validationMessages.value = messages
        if (success) dialog.value = false
      })
      return
    }

    saving.value = true
    let success = false
    if (props.isNew) success = await createRepositoryElement()
    else if (modelType.value === 'Operation') success = await updateRepositoryOperation(json)
    else success = await putSubmodelElement(draft.value, props.path!)
    saving.value = false
    if (!success) return
    dialog.value = false
    navigationStore.dispatchTriggerTreeviewReload()
  }

  async function createRepositoryElement (): Promise<boolean> {
    if (!props.parentElement) return false
    let success = false
    if (props.parentElement.modelType === 'Submodel') {
      success = await postSubmodelElement(draft.value, props.parentElement.id)
    } else {
      const [smPath, idShortPath] = props.parentElement.path.split('/submodel-elements/')
      const submodelId = base64Decode(smPath.split('/submodels/', 2)[1])
      success = await postSubmodelElement(draft.value, submodelId, idShortPath)
    }
    if (!success) return false
    const createdPath = getCreatedSubmodelElementPath(props.parentElement, draft.value.idShort)
    if (createdPath) {
      const query: Record<string, any> = { ...route.query, path: createdPath }
      delete query.fragment
      await router.push({ query })
    }
    return true
  }

  async function updateRepositoryOperation (operationJson: JsonValue): Promise<boolean> {
    if (!props.path || !operationJson || typeof operationJson !== 'object' || Array.isArray(operationJson)) return false
    const boundary = createOperationPersistenceBoundary(props.path, [], props.element || operationJson)
    const expectedMetadataJson = canonicalTreeElementJson(
      operationMetadataSnapshot(initialDraftJson.value ?? props.element ?? operationJson),
    )
    const result = await mutateOperation(boundary, ({ target }) => {
      const directions = ['inputVariables', 'inoutputVariables', 'outputVariables']
      const latestVariables = new Map(directions.map(direction => [direction, structuredClone(target[direction])]))
      for (const key of Object.keys(target)) delete target[key]
      Object.assign(target, structuredClone(operationJson))
      for (const [direction, variables] of latestVariables) {
        if (variables === undefined || variables === null) delete target[direction]
        else target[direction] = variables
      }
    }, {
      expectedTargetJson: expectedMetadataJson,
      failureTitle: 'Failed to update Operation.',
      targetSnapshot: operationMetadataSnapshot,
    })
    if (!result.success) {
      validationMessages.value = result.issues?.map(issue => issue.path ? `${issue.path}: ${issue.message}` : issue.message)
        ?? ['The Operation could not be updated.']
    }
    return result.success
  }

  function operationMetadataSnapshot (value: unknown): JsonValue {
    const snapshot = structuredClone(stripTreeMetadata(value))
    if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
      return snapshot
    }
    const metadata = snapshot as Record<string, unknown>
    for (const direction of ['inputVariables', 'inoutputVariables', 'outputVariables']) {
      delete metadata[direction]
    }
    return snapshot
  }

  function revealFirstValidationError (path: string): void {
    const valueFields = [
      'value', 'valueType', 'min', 'max', 'contentType', 'first', 'second', 'entityType',
      'globalAssetId', 'typeValueListElement', 'valueTypeListElement', 'observed', 'direction',
      'state', 'messageTopic', 'messageBroker', 'lastUpdate', 'minInterval', 'maxInterval',
    ]
    const panel = valueFields.some(field => path.includes(field)) ? 'value' : 'details'
    if (!openPanels.value.includes(panel)) openPanels.value = [...openPanels.value, panel]
    nextTick(() => document.querySelector<HTMLElement>('.v-input--error')?.focus())
  }

  function createElement (type: string): aasTypes.ISubmodelElement {
    const emptyReference = () => new types.Reference(types.ReferenceTypes.ModelReference, [
      new types.Key(types.KeyTypes.Submodel, 'urn:example:replace-me'),
    ])
    switch (type) {
      case 'Property': {
        return new types.Property(types.DataTypeDefXsd.String)
      }
      case 'MultiLanguageProperty': {
        return new types.MultiLanguageProperty()
      }
      case 'Range': {
        return new types.Range(types.DataTypeDefXsd.String)
      }
      case 'File': {
        return new types.File()
      }
      case 'Blob': {
        return new types.Blob()
      }
      case 'ReferenceElement': {
        return new types.ReferenceElement()
      }
      case 'RelationshipElement': {
        return new types.RelationshipElement()
      }
      case 'AnnotatedRelationshipElement': {
        return new types.AnnotatedRelationshipElement()
      }
      case 'SubmodelElementCollection': {
        return new types.SubmodelElementCollection()
      }
      case 'SubmodelElementList': {
        return new types.SubmodelElementList(types.AasSubmodelElements.SubmodelElement)
      }
      case 'Entity': {
        const entity = new types.Entity()
        entity.entityType = types.EntityType.SelfManagedEntity
        return entity
      }
      case 'Operation': {
        return new types.Operation()
      }
      case 'BasicEventElement': {
        return new types.BasicEventElement(
          emptyReference(),
          types.Direction.Input,
          types.StateOfEvent.On,
        )
      }
      case 'Capability': {
        return new types.Capability()
      }
      default: {
        return new types.Property(types.DataTypeDefXsd.String)
      }
    }
  }

  function getModelType (value: any): string {
    return typeof value?.modelType === 'function' ? String(value.modelType()) : String(value?.modelType || '')
  }

  function fieldError (field: string): string | undefined {
    return errors.value.get(field)
  }

  function fieldErrors (...fields: string[]): string[] {
    return fields.flatMap(field => errors.value.get(field) ?? [])
  }

  function showError (baseError: string, extendedError: string): void {
    navigationStore.dispatchSnackbar({ status: true, timeout: 10_000, color: 'error', btnColor: 'buttonText', baseError, extendedError })
  }
</script>
