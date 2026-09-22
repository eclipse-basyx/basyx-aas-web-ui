<template>
  <v-dialog
    v-model="dialog"
    :fullscreen="isMobile"
    :max-width="isMobile ? undefined : '860px'"
    persistent
  >
    <v-sheet
      border
      class="d-flex flex-column"
      :rounded="isMobile ? undefined : 'lg'"
      :style="isMobile ? { height: '100vh' } : undefined"
    >
      <v-card-title class="bg-cardHeader">Add {{ directionLabel }} Operation Variable from JSON</v-card-title>
      <v-divider />

      <v-card-text
        class="overflow-y-auto"
        :style="isMobile ? { flex: '1 1 auto', minHeight: '0' } : { maxHeight: 'calc(100vh - 200px)' }"
      >
        <v-alert class="mb-3" density="compact" type="info" variant="tonal">
          Insert exactly one AAS Core 3.1 SubmodelElement. The OperationVariable wrapper is created automatically.
        </v-alert>

        <AasJsonEditor
          v-if="dialog"
          v-model="jsonInput"
          :errors="errors"
          label="SubmodelElement JSON"
          @update:model-value="errors = []"
        />
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />
        <v-btn rounded="lg" @click="dialog = false">Cancel</v-btn>

        <v-btn
          class="text-buttonText"
          color="primary"
          :loading="saving"
          rounded="lg"
          variant="flat"
          @click="insert"
        >Add Variable</v-btn>
      </v-card-actions>
    </v-sheet>
  </v-dialog>
</template>

<script setup lang="ts">
  import type { OperationNodeLocator, OperationPersistenceBoundary, OperationVariableDirection } from '@/types/OperationTree'
  import type { JsonValue } from '@aas-core-works/aas-core3.1-typescript/jsonization'
  import { jsonization } from '@aas-core-works/aas-core3.1-typescript'
  import { useRouter } from 'vue-router'
  import { useOperationTreeMutation } from '@/composables/AAS/OperationTreeMutation'
  import { useNavigationStore } from '@/store/NavigationStore'
  import {
    createOperationPersistenceBoundary,
    isOperationOwnedNode,
    serializeOperationLocator,
  } from '@/utils/AAS/OperationTreeUtils'

  const props = defineProps<{
    modelValue: boolean
    operation: any
    direction: OperationVariableDirection
  }>()

  const emit = defineEmits<{
    'update:model-value': [value: boolean]
  }>()

  const router = useRouter()
  const navigationStore = useNavigationStore()
  const { mutateOperation } = useOperationTreeMutation()

  const dialog = ref(false)
  const jsonInput = ref('')
  const errors = ref<string[]>([])
  const saving = ref(false)

  const isMobile = computed(() => navigationStore.getIsMobile)
  const directionLabel = computed(() => {
    if (props.direction === 'inputVariables') return 'Input'
    if (props.direction === 'inoutputVariables') return 'In/Out'
    return 'Output'
  })

  watch(() => props.modelValue, value => {
    dialog.value = value
    if (value) {
      jsonInput.value = ''
      errors.value = []
    }
  })
  watch(dialog, value => emit('update:model-value', value))

  async function insert (): Promise<void> {
    errors.value = []
    let parsedJson: unknown
    try {
      parsedJson = JSON.parse(jsonInput.value)
    } catch {
      errors.value = ['Enter valid JSON.']
      return
    }

    if (Array.isArray(parsedJson)) {
      errors.value = ['Insert exactly one SubmodelElement object, not an array.']
      return
    }
    if (!parsedJson || typeof parsedJson !== 'object' || !('modelType' in parsedJson)) {
      errors.value = ['Expected a SubmodelElement object with modelType. OperationVariable wrappers are not accepted.']
      return
    }

    const parsedElement = jsonization.submodelElementFromJsonable(parsedJson as JsonValue)
    if (parsedElement.error !== null) {
      errors.value = [parsedElement.error.message || String(parsedElement.error)]
      return
    }

    const boundary = getOperationBoundary()
    const elementJson = jsonization.toJsonable(parsedElement.mustValue())
    let newLocator: OperationNodeLocator | null = null
    saving.value = true
    const result = await mutateOperation(boundary, ({ target }) => {
      const variables = Array.isArray(target[props.direction]) ? target[props.direction] : []
      const newIndex = variables.length
      variables.push({ value: elementJson })
      target[props.direction] = variables
      newLocator = [...boundary.locator, props.direction, newIndex, 'value']
    }, { checkExpectedTarget: isOperationOwnedNode(props.operation) })
    saving.value = false

    if (!result.success || !newLocator) return

    dialog.value = false
    navigationStore.dispatchTriggerTreeviewReload()
    await router.push({
      query: {
        ...router.currentRoute.value.query,
        path: boundary.operationPath,
        fragment: serializeOperationLocator(newLocator),
      },
    })
  }

  function getOperationBoundary (): OperationPersistenceBoundary {
    if (isOperationOwnedNode(props.operation)) return props.operation.persistence
    return createOperationPersistenceBoundary(props.operation.path, [], props.operation)
  }
</script>
